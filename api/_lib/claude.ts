import { callClaudeAPI, type ClaudeUsage } from './call-claude'
import { getIdentityAndVoice, type AgentPersonality } from '../_agents/personalities'

// ── Types ────────────────────────────────────────────────────

export interface PostCandidate {
  title:            string
  summary:          string
  source_url:       string
  importance_score: number
}

export interface GeneratedPost {
  headline: string
  body:     string
}

export interface PostGenerationResult {
  candidates:          PostCandidate[]
  selectedIndex:       number | null
  selectionReasoning:  string
  post:                GeneratedPost | null
  imageQuery:          string | null
  usage:              ClaudeUsage
}

// ── Structured JSON schema for Claude's response ─────────────

interface ClaudePostResponse {
  candidates:           { title: string; summary: string; source_url: string; importance_score: number }[]
  selected_index:       number | null
  selection_reasoning:  string
  post:                 { headline: string; body: string } | null
  image_query?:         string | null
}

// ── JSON extraction ──────────────────────────────────────────
// Claude may emit conversational preamble around the JSON when
// web_search is enabled. This function robustly extracts JSON
// from various response shapes.

function extractJSON(raw: string): string {
  const trimmed = raw.trim()

  // 1. Starts with { — likely raw JSON, try directly
  if (trimmed.startsWith('{')) {
    return trimmed
  }

  // 2. Look for a ```json ... ``` fenced block anywhere
  const fenceMatch = trimmed.match(/```json\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // 3. Bare ``` ... ``` fence (no language tag) if content looks like JSON
  const bareFenceMatch = trimmed.match(/```\s*\n?([\s\S]*?)\n?\s*```/)
  if (bareFenceMatch && bareFenceMatch[1].trim().startsWith('{')) {
    return bareFenceMatch[1].trim()
  }

  // 4. Fallback: find outermost balanced { ... }, string-aware.
  //    Tracks whether we're inside a JSON string to avoid miscounting
  //    braces that appear inside string values (e.g. prose fields).
  const firstBrace = trimmed.indexOf('{')
  if (firstBrace >= 0) {
    let depth = 0
    let inString = false
    for (let i = firstBrace; i < trimmed.length; i++) {
      const ch = trimmed[i]
      if (inString) {
        if (ch === '\\') { i++; continue }  // skip escaped char
        if (ch === '"') inString = false
      } else {
        if (ch === '"') inString = true
        else if (ch === '{') depth++
        else if (ch === '}') { depth--; if (depth === 0) return trimmed.slice(firstBrace, i + 1) }
      }
    }
  }

  // 5. Nothing worked — return raw so JSON.parse fails with full context
  return trimmed
}

// ── Post generation ──────────────────────────────────────────
// Builds the full system prompt from personality fields, injects
// recent-post memory for dedup, enables web_search, and parses
// the structured JSON response.

export async function generatePost(
  personality: AgentPersonality,
  recentHeadlines: string[],
): Promise<PostGenerationResult> {
  const identityAndVoice = getIdentityAndVoice(personality)

  // Build system prompt sections
  const todayISO = new Date().toISOString().slice(0, 10)

  const sections: string[] = [
    // 1. Identity and voice
    identityAndVoice,

    // 2. Date context (recency anchor)
    `[DATE CONTEXT]\nToday's date is ${todayISO}. The story you select MUST be a development that occurred or was announced within the last 72 hours of this date. Strongly prefer stories from the last 24 hours; 72 hours is the absolute ceiling. Any story older than 72 hours is INELIGIBLE regardless of how significant it is. A significant old story is still old news — do not present it as current.`,

    // 3. Domain scope
    `[DOMAIN]\nYou cover ${personality.domain}. You do NOT cover topics outside this domain.`,

    // 4. Source whitelist
    `[SOURCE WHITELIST]\nWhen searching for news, only consider sources from this whitelist: ${personality.sourceWhitelist.join(', ')}. If a story's primary coverage is outside this whitelist, do not select it.`,

    // 5. Top news rubric
    `[TOP NEWS CRITERIA]\n${personality.topNewsRubric}`,

    // 6. Recent-post memory
    buildRecentPostsSection(recentHeadlines),

    // 7. Output format (from personality.postGenerationRules)
    `[OUTPUT FORMAT]\n${personality.postGenerationRules}`,

    // 8. Refuse-to-post path
    `[REFUSE-TO-POST]\nIf no story you find meets the criteria above, OR if every story meaningfully overlaps with the recent posts listed above, OR if web_search only surfaces stories older than 72 hours from today (${todayISO}), OR if you cannot positively confirm a story's date falls within the last 72 hours — return null for selected_index and post, and explain why in selection_reasoning. Do not force a post. Refusing to post on a quiet news day is the correct and expected behavior, not a failure. An empty window is fine. Posting old news as current is a serious error. When uncertain about a story's recency, refuse rather than risk it.`,
  ]

  const systemPrompt = sections.join('\n\n')

  const response = await callClaudeAPI({
    systemPrompt,
    userMessage: `Find the most important ${personality.domain} news from the last 24 hours (today is ${todayISO}) and write a post about it following your instructions. If nothing significant happened in the last 24 hours, you may go back up to 72 hours. If nothing eligible exists within 72 hours, refuse to post.`,
    maxTokens:   2048,
    tools:       [{ type: 'web_search_20250305', name: 'web_search' }],
  })

  const extracted = extractJSON(response.text)

  let parsed: ClaudePostResponse
  try {
    parsed = JSON.parse(extracted)
  } catch {
    throw new Error(`Claude returned non-JSON: ${response.text}`)
  }

  // Validate candidates array
  if (!Array.isArray(parsed.candidates) || parsed.candidates.length === 0) {
    throw new Error(`Claude response missing candidates: ${JSON.stringify(parsed)}`)
  }

  // Validate post fields when a selection was made
  if (parsed.selected_index !== null && parsed.post) {
    if (!parsed.post.headline || !parsed.post.body) {
      throw new Error(`Claude response has selected_index but post is incomplete: ${JSON.stringify(parsed)}`)
    }
  }

  return {
    candidates: parsed.candidates.map(c => ({
      title:            c.title ?? '',
      summary:          c.summary ?? '',
      source_url:       c.source_url ?? '',
      importance_score: c.importance_score ?? 0,
    })),
    selectedIndex:      parsed.selected_index,
    selectionReasoning: parsed.selection_reasoning ?? '',
    post: parsed.post ? {
      headline: parsed.post.headline.trim(),
      body:     parsed.post.body.trim(),
    } : null,
    imageQuery:         (typeof parsed.image_query === 'string' && parsed.image_query.trim()) ? parsed.image_query.trim() : null,
    usage: response.usage,
  }
}

// ── Helper: build recent posts section ───────────────────────

function buildRecentPostsSection(headlines: string[]): string {
  if (headlines.length === 0) {
    return '[RECENT POSTS]\nNo recent posts found for this agent. This is either the first run or the history is empty.'
  }

  const list = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
  return `[RECENT POSTS]\nHere are the last ${headlines.length} headlines this agent has posted in chronological order, most recent first:\n${list}\n\nDo NOT pick a story that covers the same topic as any of these. If today's most important story is an extension or follow-up to one of these, either find a fresh angle or skip.`
}
