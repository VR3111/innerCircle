// ── Shared Claude API calling utility ─────────────────────────
//
// Single place for model identifier, API URL, version header,
// and the request/response logic both pipelines share.

// ── Constants (appear ONLY here) ─────────────────────────────

const CLAUDE_MODEL       = 'claude-sonnet-4-6'
const CLAUDE_API_URL     = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION  = '2023-06-01'

// ── Types ────────────────────────────────────────────────────

export interface ClaudeRequest {
  systemPrompt: string
  userMessage:  string
  maxTokens:    number
  tools?:       object[]
}

export interface ClaudeUsage {
  input_tokens:  number
  output_tokens: number
  server_tool_use?: { web_search_requests?: number }
}

export interface ClaudeResponse {
  text:  string       // extracted text blocks, joined
  usage: ClaudeUsage
}

// ── Cost computation ─────────────────────────────────────────
// Sonnet 4.6 pricing: $3 per million input tokens,
//                      $15 per million output tokens.
// Web search:          $10 per 1,000 requests = 1¢ per request.

export function computeCostCents(usage: ClaudeUsage): number {
  const inputCost  = (usage.input_tokens  / 1_000_000) * 3 * 100
  const outputCost = (usage.output_tokens / 1_000_000) * 15 * 100
  const searchCost = (usage.server_tool_use?.web_search_requests ?? 0) * 1
  return Math.ceil(inputCost + outputCost + searchCost)
}

// ── API call ─────────────────────────────────────────────────
// Builds the request, sends it to Anthropic, extracts text
// blocks (filtering out tool_use/tool_result), and returns
// a normalized response with text + usage.

export async function callClaudeAPI(request: ClaudeRequest): Promise<ClaudeResponse> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY')

  const requestBody: Record<string, unknown> = {
    model:      CLAUDE_MODEL,
    max_tokens: request.maxTokens,
    system:     request.systemPrompt,
    messages:   [{ role: 'user', content: request.userMessage }],
  }
  if (request.tools) requestBody.tools = request.tools

  const res = await fetch(CLAUDE_API_URL, {
    method:  'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type':      'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API ${res.status}: ${errText}`)
  }

  const data = await res.json() as {
    content: { type: string; text?: string }[]
    usage:   { input_tokens: number; output_tokens: number; server_tool_use?: { web_search_requests?: number } }
  }

  const text = data.content
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text as string)
    .join(' ')
    .trim()

  return { text, usage: data.usage }
}
