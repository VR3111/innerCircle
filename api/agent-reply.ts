import { getSupabaseAdmin } from './_lib/supabase-admin'
import {
  AGENT_PROFILE_IDS,
  AGENT_NAMES,
  AGENT_REPLIES_PER_POST_LIMIT,
  AGENT_REPLIES_PER_USER_PER_POST_LIMIT,
  AGENT_REPLY_MAX_TOKENS,
} from './_agents/constants'
import { AGENT_PROMPTS } from './_agents/prompts'

// Give Claude + web search enough runway. Vercel Hobby cap is 60s.
export const config = { maxDuration: 45 }

const CLAUDE_MODEL   = 'claude-sonnet-4-5'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

// ── Types ─────────────────────────────────────────────────────

interface AgentReplyRequest {
  postId:           string   // uuid of the post
  userReplyId:      string   // uuid of the user's reply that triggered this
  userReplyContent: string   // text of that reply (contains the @agent tag)
  postHeadline:     string
  postBody:         string
  taggedAgent:      string   // 'baron' | 'blitz' | 'circuit' | 'reel' | 'pulse' | 'atlas'
  userId:           string   // uuid of the triggering user
}

interface AgentReplyResponse {
  success:       true
  replyId:       string
  replyContent:  string
  isCapHit:      boolean
  isPinned:      boolean
  capHitReason?: 'per_post' | 'per_user'
}

type ReplyMode = 'normal' | 'cap_hit'

// ── In-character fallbacks when Claude returns nothing ─────────
// Used only if text extraction produces an empty string.

const FALLBACK_REPLIES: Record<string, string> = {
  baron:   'Technical issue on my end. The market will still be there when I return.',
  blitz:   'Technical timeout. The game keeps moving — I will catch up.',
  circuit: 'Request failed. Retry when you have a real question.',
  reel:    'Something interrupted my train of thought. The drama continues without me for a moment.',
  pulse:   'Technical fault. Come back and we will pick this up.',
  atlas:   'A communications failure. The situation continues to develop.',
}

// ── Auth validation ────────────────────────────────────────────
// Verifies the Bearer token against Supabase's /auth/v1/user endpoint
// and confirms it belongs to the claimed userId. This prevents anyone
// from POST-ing arbitrary requests and burning Anthropic API budget.

async function validateAuth(token: string, userId: string): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey     = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return false

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey':        anonKey,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) return false
    const user = await res.json() as { id?: string }
    return user.id === userId
  } catch {
    return false
  }
}

// ── Text helpers ───────────────────────────────────────────────

// When web_search is used, Claude's response contains tool_use,
// tool_result, and text blocks. We only want the text blocks.
function extractTextBlocks(content: { type: string; text?: string }[]): string {
  return content
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text as string)
    .join(' ')
    .trim()
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

// Trim at the last sentence boundary before `max` chars.
// Ensures we never ship a mid-sentence reply.
function trimAtSentenceBoundary(text: string, max = 600): string {
  if (text.length <= max) return text
  const candidate = text.slice(0, max)
  let   best      = -1
  for (const end of ['. ', '! ', '? ', '." ', '." ']) {
    const idx = candidate.lastIndexOf(end)
    if (idx > best) best = idx + end.length - 1
  }
  // Only cut if we find a boundary at least halfway through the window.
  return best > max * 0.5 ? text.slice(0, best).trim() : candidate.trim()
}

function sanitizeReply(text: string): string {
  return trimAtSentenceBoundary(stripMarkdownFences(text))
}

// ── Claude API call ────────────────────────────────────────────
// Uses raw fetch consistent with api/_lib/claude.ts.
// Web search (web_search_20250305) is a server-side Anthropic-hosted
// tool — Anthropic executes searches internally; we do not need to
// implement a tool loop. The response arrives with stop_reason: 'end_turn'
// containing all content blocks.

async function callClaude(
  agentName: string,
  mode: ReplyMode,
  context?: { postHeadline: string; postBody: string; userComment: string; isFinalReply?: boolean },
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY')

  const systemPrompt = AGENT_PROMPTS[agentName]
  if (!systemPrompt) throw new Error(`No system prompt for agent: ${agentName}`)

  let userMessage: string
  let tools: object[] | undefined

  if (mode === 'cap_hit') {
    // Cap-hit: short, no web search needed
    userMessage = [
      'Generate a short cap-hit goodbye message.',
      'The user has reached their reply limit.',
      'Follow your [CAP-HIT GOODBYE] rules exactly.',
      'One sentence only.',
    ].join(' ')
    tools = undefined
  } else {
    const parts = [
      `POST HEADLINE: ${context!.postHeadline}`,
      '',
      `POST BODY: ${context!.postBody}`,
      '',
      `USER COMMENT: ${context!.userComment}`,
    ]
    if (context!.isFinalReply) {
      parts.push(
        '',
        '[CONVERSATION NOTE: This is the final exchange with this user on this post. ' +
        'Bring the conversation to a natural close in your own voice — one brief closing ' +
        'remark at the end is enough. Do not mention numbers, limits, or technical details. ' +
        'Stay in character.]',
      )
    }
    userMessage = parts.join('\n')
    tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  }

  const requestBody: Record<string, unknown> = {
    model:      CLAUDE_MODEL,
    max_tokens: AGENT_REPLY_MAX_TOKENS,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMessage }],
  }
  if (tools) requestBody.tools = tools

  const res = await fetch(CLAUDE_API_URL, {
    method:  'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API ${res.status}: ${errText}`)
  }

  const data = await res.json() as { content: { type: string; text?: string }[] }
  const raw  = extractTextBlocks(data.content)
  return sanitizeReply(raw) || FALLBACK_REPLIES[agentName] || 'Technical error. Please try again.'
}

// ── DB helpers ─────────────────────────────────────────────────

async function countPostAgentReplies(postId: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('replies')
    .select('id', { count: 'exact', head: true })
    .eq('post_id',        postId)
    .eq('is_agent_reply', true)

  if (error) throw new Error(`countPostAgentReplies: ${error.message}`)
  return count ?? 0
}

// Counts how many times THIS SPECIFIC AGENT has replied to THIS USER on THIS POST.
// Each agent has its own independent per-user pool — replies from other agents
// do not count toward this agent's limit.
async function countAgentRepliesToUser(postId: string, userId: string, agentName: string): Promise<number> {
  // Step 1: find all reply IDs the user has posted on this post
  const { data: userReplies, error: e1 } = await getSupabaseAdmin()
    .from('replies')
    .select('id')
    .eq('post_id',        postId)
    .eq('user_id',        userId)
    .eq('is_agent_reply', false)

  if (e1) throw new Error(`countAgentRepliesToUser (user replies): ${e1.message}`)
  if (!userReplies || userReplies.length === 0) return 0

  // Step 2: count replies from THIS agent whose parent is one of those reply IDs
  const ids = userReplies.map(r => r.id)
  const { count, error: e2 } = await getSupabaseAdmin()
    .from('replies')
    .select('id', { count: 'exact', head: true })
    .eq('is_agent_reply', true)
    .eq('user_id',        AGENT_PROFILE_IDS[agentName])
    .in('parent_reply_id', ids)

  if (e2) throw new Error(`countAgentRepliesToUser (agent replies): ${e2.message}`)
  return count ?? 0
}

// Idempotency: did an agent already reply to this exact user reply?
async function findExistingAgentReplyFor(
  userReplyId: string,
): Promise<{ id: string; content: string; is_pinned: boolean } | null> {
  const { data } = await getSupabaseAdmin()
    .from('replies')
    .select('id, content, is_pinned')
    .eq('parent_reply_id', userReplyId)
    .eq('is_agent_reply',  true)
    .limit(1)
    .maybeSingle()

  return data ?? null
}

// Per-post cap-hit: is there already a pinned cap-hit reply on this post?
async function findExistingPinnedCapHit(
  postId: string,
): Promise<{ id: string; content: string } | null> {
  const { data } = await getSupabaseAdmin()
    .from('replies')
    .select('id, content')
    .eq('post_id',        postId)
    .eq('is_agent_reply', true)
    .eq('is_pinned',      true)
    .limit(1)
    .maybeSingle()

  return data ?? null
}

async function insertAgentReply(params: {
  postId:      string
  userReplyId: string
  agentName:   string
  content:     string
  isPinned:    boolean
}): Promise<{ id: string }> {
  const { data, error } = await getSupabaseAdmin()
    .from('replies')
    .insert({
      user_id:         AGENT_PROFILE_IDS[params.agentName],
      post_id:         params.postId,
      content:         params.content,
      is_agent_reply:  true,
      is_pinned:       params.isPinned,
      parent_reply_id: params.userReplyId,
      is_inner_circle: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(`insertAgentReply: ${error.message}`)
  return data
}

// ── Handler ────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ── 1. Extract Bearer token ────────────────────────────────
    const authHeader = ((req.headers['authorization'] ?? '') as string).trim()
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    // ── 2. Parse & validate request body ──────────────────────
    const body = (req.body ?? {}) as Partial<AgentReplyRequest>
    const {
      postId,
      userReplyId,
      userReplyContent,
      postHeadline,
      postBody,
      taggedAgent,
      userId,
    } = body

    const requiredFields: (keyof AgentReplyRequest)[] = [
      'postId', 'userReplyId', 'userReplyContent',
      'postHeadline', 'postBody', 'taggedAgent', 'userId',
    ]
    const missing = requiredFields.filter(f => !body[f])
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
    }

    // ── 3. Validate agent name ─────────────────────────────────
    if (!(AGENT_NAMES as readonly string[]).includes(taggedAgent!)) {
      return res.status(422).json({ error: `Unknown agent: ${taggedAgent}. Must be one of: ${AGENT_NAMES.join(', ')}` })
    }

    // ── 4. Validate env vars early ─────────────────────────────
    const missing_env = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
    ].filter(k => !process.env[k])
    if (missing_env.length) {
      console.error('[agent-reply] Missing env vars:', missing_env.join(', '))
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    // ── 5. Validate auth token (costs money if skipped) ───────
    const authed = await validateAuth(token, userId!)
    if (!authed) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' })
    }

    // ── 6. Idempotency — already replied to this user reply? ──
    const existingReply = await findExistingAgentReplyFor(userReplyId!)
    if (existingReply) {
      console.log(`[agent-reply] Idempotent return for userReplyId=${userReplyId}`)
      return res.status(200).json({
        success:      true,
        replyId:      existingReply.id,
        replyContent: existingReply.content,
        isCapHit:     false,
        isPinned:     existingReply.is_pinned,
      } as AgentReplyResponse)
    }

    // ── 7. Verify post and user reply exist ────────────────────
    const { data: post } = await getSupabaseAdmin()
      .from('posts')
      .select('id')
      .eq('id', postId!)
      .maybeSingle()
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const { data: userReplyRow } = await getSupabaseAdmin()
      .from('replies')
      .select('id')
      .eq('id', userReplyId!)
      .maybeSingle()
    if (!userReplyRow) {
      return res.status(404).json({ error: 'User reply not found' })
    }

    // ── 8. Rate limit checks (parallel) ───────────────────────
    const [postCount, userCount] = await Promise.all([
      countPostAgentReplies(postId!),
      countAgentRepliesToUser(postId!, userId!, taggedAgent!),
    ])

    console.log(`[agent-reply] post=${postId} agent=${taggedAgent} postCount=${postCount} userCount=${userCount}`)

    // ── 9a. Per-post cap hit ───────────────────────────────────
    if (postCount >= AGENT_REPLIES_PER_POST_LIMIT) {
      const pinnedExisting = await findExistingPinnedCapHit(postId!)
      if (pinnedExisting) {
        // Reuse the existing pinned cap-hit — don't generate another
        return res.status(200).json({
          success:      true,
          replyId:      pinnedExisting.id,
          replyContent: pinnedExisting.content,
          isCapHit:     true,
          isPinned:     true,
          capHitReason: 'per_post',
        } as AgentReplyResponse)
      }
      // Generate the first (and only) pinned cap-hit for this post
      const capText = await callClaude(taggedAgent!, 'cap_hit')
      const row     = await insertAgentReply({
        postId:      postId!,
        userReplyId: userReplyId!,
        agentName:   taggedAgent!,
        content:     capText,
        isPinned:    true,
      })
      return res.status(200).json({
        success:      true,
        replyId:      row.id,
        replyContent: capText,
        isCapHit:     true,
        isPinned:     true,
        capHitReason: 'per_post',
      } as AgentReplyResponse)
    }

    // ── 9b. Per-user cap hit ───────────────────────────────────
    if (userCount >= AGENT_REPLIES_PER_USER_PER_POST_LIMIT) {
      const capText = await callClaude(taggedAgent!, 'cap_hit')
      const row     = await insertAgentReply({
        postId:      postId!,
        userReplyId: userReplyId!,
        agentName:   taggedAgent!,
        content:     capText,
        isPinned:    false,
      })
      return res.status(200).json({
        success:      true,
        replyId:      row.id,
        replyContent: capText,
        isCapHit:     true,
        isPinned:     false,
        capHitReason: 'per_user',
      } as AgentReplyResponse)
    }

    // ── 9c. Normal reply ───────────────────────────────────────
    // isFinalAllowedReply: userCount is currently 4, meaning THIS reply is the
    // 5th (allowed). The 6th would be a cap hit, so we prompt a natural close.
    const isFinalAllowedReply = userCount === AGENT_REPLIES_PER_USER_PER_POST_LIMIT - 1
    const replyText = await callClaude(taggedAgent!, 'normal', {
      postHeadline:  postHeadline!,
      postBody:      postBody!,
      userComment:   userReplyContent!,
      isFinalReply:  isFinalAllowedReply,
    })
    const row = await insertAgentReply({
      postId:      postId!,
      userReplyId: userReplyId!,
      agentName:   taggedAgent!,
      content:     replyText,
      isPinned:    false,
    })

    console.log(`[agent-reply] Posted reply ${row.id} for agent=${taggedAgent} post=${postId}`)

    return res.status(200).json({
      success:      true,
      replyId:      row.id,
      replyContent: replyText,
      isCapHit:     false,
      isPinned:     false,
    } as AgentReplyResponse)

  } catch (err: any) {
    // Never leak internals — log server-side only
    console.error('[agent-reply] Unhandled error:', err?.message ?? err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
