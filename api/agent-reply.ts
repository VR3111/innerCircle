// ── Cost-safety env vars ───────────────────────────────────────
//
//   AGENT_REPLIES_ENABLED=true                  Master kill switch.
//                                               Set to 'false' to disable all agent replies.
//                                               Defaults to enabled when missing.
//
//   AGENT_REPLIES_DAILY_COST_LIMIT_CENTS=4000   Hard daily spend ceiling in cents ($40.00).
//                                               Resets at UTC midnight via the daily_spend table.
//                                               Defaults to 2000 when missing.
//
//   AGENT_REPLIES_PER_USER_DAILY_CAP=20         Max agent replies a single user can receive
//                                               across all agents in any rolling 24-hour window.
//                                               Defaults to 20 when missing.

import { getSupabaseAdmin } from './_lib/supabase-admin'
import { callClaudeAPI, computeCostCents } from './_lib/call-claude'
import { getTodaySpendCents, incrementTodaySpendCents } from './_lib/daily-spend'
import {
  AGENT_PROFILE_IDS,
  AGENT_NAMES,
  AGENT_REPLIES_PER_POST_LIMIT,
  AGENT_REPLIES_PER_USER_PER_POST_LIMIT,
  AGENT_REPLY_MAX_TOKENS,
} from './_agents/constants'
import { AGENT_PERSONALITIES } from './_agents/personalities'

// Give Claude + web search enough runway. Vercel Hobby cap is 60s.
export const config = { maxDuration: 45 }

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
  replyId?:      string   // absent on ephemeral cap-hit responses (per_user)
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

// Used for per-user cap-hit responses (ephemeral, toast-only on frontend).
// No DB insert and no Claude call — returned directly to the client.
const FALLBACK_CAP_HIT_MESSAGES: Record<string, string> = {
  baron:   "You've asked enough today. The market moves on without you.",
  blitz:   "Final whistle on our chat for now. Catch me on the next post.",
  circuit: "Rate limited. Tag me on another thread if you want more.",
  reel:    "That's a wrap on this scene. Come find me somewhere else.",
  pulse:   "Recovery time. Come back when you've earned another set.",
  atlas:   "I've said my piece here. Take this elsewhere.",
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

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

// ── Sentence-boundary guard ───────────────────────────────────
// Guarantees: user sees either (a) a naturally complete reply,
// (b) a reply trimmed to a real sentence boundary, or (c) a reply
// trimmed to a whole word with trailing '…'. Never mid-word garbage.

const ABBREV_SET = new Set([
  'u.s', 'u.k', 'u.n', 'inc', 'corp', 'ltd', 'vs', 'jr', 'sr',
  'mr', 'mrs', 'ms', 'dr', 'q1', 'q2', 'q3', 'q4', 'a.m', 'p.m',
])

function isUnambiguousSentenceEnd(text: string, punctIdx: number): boolean {
  // The punctuation at punctIdx must be followed by whitespace (or be end-of-text
  // handled by Tier 1). We only call this for mid-text boundaries.
  const nextChar = text[punctIdx + 1]
  if (!nextChar || !/\s/.test(nextChar)) return false

  // Rule out digit immediately before punctuation (decimals: "4.55 ")
  if (punctIdx > 0 && /\d/.test(text[punctIdx - 1])) return false

  // Rule out single uppercase letter before punctuation ("U. S. ")
  if (punctIdx >= 1 && /^[A-Z]$/.test(text[punctIdx - 1])) {
    // Check if it's a lone letter (start of text or preceded by space/period)
    if (punctIdx === 1 || /[\s.]/.test(text[punctIdx - 2])) return false
  }

  // Rule out known abbreviations: look back from punctIdx to find the word
  const before = text.slice(Math.max(0, punctIdx - 10), punctIdx)
  const wordMatch = before.match(/([A-Za-z.]+)$/)
  if (wordMatch) {
    const candidate = wordMatch[1].toLowerCase().replace(/\.$/, '')
    if (ABBREV_SET.has(candidate)) return false
  }

  return true
}

function trimToCharLimit(text: string, max = 600): string {
  if (text.length <= max) return text
  const candidate = text.slice(0, max)
  // Find last unambiguous sentence boundary within the char limit
  let best = -1
  for (let i = candidate.length - 1; i >= 0; i--) {
    if ((candidate[i] === '.' || candidate[i] === '!' || candidate[i] === '?') &&
        isUnambiguousSentenceEnd(candidate, i) && i > best) {
      best = i
      break
    }
  }
  if (best >= 0) return candidate.slice(0, best + 1).trim()
  // Fallback: trim to last word boundary + ellipsis
  const lastSpace = candidate.lastIndexOf(' ')
  if (lastSpace > 0) return candidate.slice(0, lastSpace).trim() + '\u2026'
  return candidate.trim() + '\u2026'
}

function trimIncompleteSentence(text: string): string {
  // TIER 1: Reply ends with sentence-ending punctuation — return as-is
  if (/[.!?]["'\u2019\u201D]?\s*$/.test(text)) return text

  // TIER 2: Token-truncated. Find last unambiguous sentence boundary.
  let best = -1
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
      if (isUnambiguousSentenceEnd(text, i)) {
        best = i
        break
      }
    }
  }

  // If an unambiguous boundary exists anywhere, trim there (no floor)
  if (best >= 0) return text.slice(0, best + 1).trim()

  // No sentence boundary at all: trim to last word boundary + ellipsis
  const lastSpace = text.lastIndexOf(' ')
  if (lastSpace > 0) return text.slice(0, lastSpace).trim() + '\u2026'
  return text.trim() + '\u2026'
}

function sanitizeReply(text: string): string {
  const stripped = stripMarkdownFences(text)
  const charLimited = trimToCharLimit(stripped)
  return trimIncompleteSentence(charLimited)
}

// ── Claude API call ────────────────────────────────────────────
// Uses the shared callClaudeAPI utility.
// Web search (web_search_20250305) is a server-side Anthropic-hosted
// tool — Anthropic executes searches internally; we do not need to
// implement a tool loop. The response arrives with stop_reason: 'end_turn'
// containing all content blocks.

async function callClaude(
  agentName: string,
  mode: ReplyMode,
  context?: { postHeadline: string; postBody: string; userComment: string; threadContext?: string; isFinalReply?: boolean },
): Promise<{ text: string; costCents: number }> {
  const personality = AGENT_PERSONALITIES[agentName]
  if (!personality) throw new Error(`No personality for agent: ${agentName}`)

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
    ]
    if (context!.threadContext) {
      parts.push('', context!.threadContext)
    }
    parts.push(
      '',
      `USER COMMENT (respond to this): ${context!.userComment}`,
    )
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

  const response = await callClaudeAPI({
    systemPrompt: personality.replySystemPrompt,
    maxTokens:    AGENT_REPLY_MAX_TOKENS,
    userMessage,
    tools,
  })

  const text = sanitizeReply(response.text) || FALLBACK_REPLIES[agentName] || 'Technical error. Please try again.'
  const costCents = computeCostCents(response.usage)

  return { text, costCents }
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

// Walks up one level to find the top-level parent of a reply.
// If the reply has no parent (it IS top-level), returns its own id.
// Used to ensure agent replies always attach to the top-level comment,
// not to a nested child reply (Instagram flat-threading model).
async function resolveTopLevelParent(userReplyId: string): Promise<string> {
  const { data } = await getSupabaseAdmin()
    .from('replies')
    .select('id, parent_reply_id')
    .eq('id', userReplyId)
    .maybeSingle()
  if (!data) return userReplyId  // fallback: use as-is if not found
  return data.parent_reply_id ?? data.id
}

async function insertAgentReply(params: {
  postId:           string
  topLevelParentId: string   // always the top-level comment id (flattened)
  agentName:        string
  content:          string
  isPinned:         boolean
}): Promise<{ id: string }> {
  const { data, error } = await getSupabaseAdmin()
    .from('replies')
    .insert({
      user_id:         AGENT_PROFILE_IDS[params.agentName],
      post_id:         params.postId,
      content:         params.content,
      is_agent_reply:  true,
      is_pinned:       params.isPinned,
      parent_reply_id: params.topLevelParentId,
      is_inner_circle: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(`insertAgentReply: ${error.message}`)
  return data
}

// ── Per-user rolling-24h cap helper ───────────────────────────

// Counts how many agent replies this user has received across all agents
// in the last 24 hours (rolling window, not UTC-day-reset).
async function countUserAgentRepliesLast24h(userId: string): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Step 1: find the user's own replies in the last 24h
  const { data: userReplies } = await getSupabaseAdmin()
    .from('replies')
    .select('id')
    .eq('user_id',        userId)
    .eq('is_agent_reply', false)
    .gte('created_at',    cutoff)

  if (!userReplies || userReplies.length === 0) return 0

  // Step 2: count agent replies whose parent is one of those reply IDs
  const ids = userReplies.map(r => r.id)
  const { count } = await getSupabaseAdmin()
    .from('replies')
    .select('id', { count: 'exact', head: true })
    .eq('is_agent_reply', true)
    .in('parent_reply_id', ids)

  return count ?? 0
}

// ── Conversation thread fetch ─────────────────────────────────
// Fetches the thread under a top-level comment: the comment itself
// plus all its direct siblings (replies with parent_reply_id pointing
// to it). Returns chronological order, capped at the last 8 messages.
// Uses the existing idx_replies_parent_reply_id index.

interface ThreadMessage {
  content:      string
  isAgentReply: boolean
  userId:       string
  createdAt:    string
}

async function fetchThreadMessages(topLevelParentId: string): Promise<ThreadMessage[]> {
  // Fetch the top-level comment itself + all siblings underneath it
  const { data, error } = await getSupabaseAdmin()
    .from('replies')
    .select('content, is_agent_reply, user_id, created_at')
    .or(`id.eq.${topLevelParentId},parent_reply_id.eq.${topLevelParentId}`)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  const messages: ThreadMessage[] = data.map(row => ({
    content:      row.content,
    isAgentReply: row.is_agent_reply,
    userId:       row.user_id,
    createdAt:    row.created_at,
  }))

  // Cap at last 8 messages (keep most recent including the triggering one)
  if (messages.length > 8) {
    return messages.slice(-8)
  }
  return messages
}

function formatThreadForPrompt(messages: ThreadMessage[], agentName: string): string {
  if (messages.length <= 1) return ''  // Only the triggering message — no thread context needed

  const agentProfileId = AGENT_PROFILE_IDS[agentName]
  const lines = messages.slice(0, -1).map(msg => {
    if (msg.isAgentReply && msg.userId === agentProfileId) {
      return `[${agentName.charAt(0).toUpperCase() + agentName.slice(1)}]: ${msg.content}`
    } else if (msg.isAgentReply) {
      return `[Agent]: ${msg.content}`
    } else {
      return `[User]: ${msg.content}`
    }
  })

  return 'CONVERSATION THREAD (previous messages, oldest first):\n' + lines.join('\n')
}

// ── Handler ────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── 1. Kill switch — cheapest possible check, no DB or auth ──
  // Explicit 'false' string only; missing var defaults to enabled.
  if (process.env.AGENT_REPLIES_ENABLED === 'false') {
    return res.status(200).json({
      error:        'Agent replies temporarily unavailable. Try again shortly.',
      isCapHit:     true,
      capHitReason: 'service_disabled',
    })
  }

  try {
    // ── 2. Extract Bearer token ────────────────────────────────
    const authHeader = ((req.headers['authorization'] ?? '') as string).trim()
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    // ── 3. Parse & validate request body ──────────────────────
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

    // ── 4. Validate agent name ─────────────────────────────────
    if (!(AGENT_NAMES as readonly string[]).includes(taggedAgent!)) {
      return res.status(422).json({ error: `Unknown agent: ${taggedAgent}. Must be one of: ${AGENT_NAMES.join(', ')}` })
    }

    // ── 5. Validate env vars early ─────────────────────────────
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

    // ── 6. Validate auth token (costs money if skipped) ───────
    const authed = await validateAuth(token, userId!)
    if (!authed) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' })
    }

    // ── 7. Idempotency — already replied to this user reply? ──
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

    // ── 8. Verify post and user reply exist ────────────────────
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

    // Resolve the top-level parent for INSERT.
    // Idempotency check above still uses userReplyId (unchanged).
    const topLevelParentId = await resolveTopLevelParent(userReplyId!)

    // ── 9. Daily cost ceiling check ────────────────────────────
    const dailyLimit = parseInt(process.env.AGENT_REPLIES_DAILY_COST_LIMIT_CENTS ?? '4000', 10)
    const todaySpend = await getTodaySpendCents()
    if (todaySpend >= dailyLimit) {
      console.log(`[agent-reply] Daily cost limit hit: ${todaySpend}/${dailyLimit} cents`)
      return res.status(200).json({
        error:        'Agents are resting for today. They will be back tomorrow.',
        isCapHit:     true,
        capHitReason: 'daily_cost_limit',
      })
    }

    // ── 10. Per-user daily cap check ───────────────────────────
    const userDailyCap   = parseInt(process.env.AGENT_REPLIES_PER_USER_DAILY_CAP ?? '20', 10)
    const userDailyCount = await countUserAgentRepliesLast24h(userId!)
    if (userDailyCount >= userDailyCap) {
      console.log(`[agent-reply] User daily cap hit: userId=${userId} count=${userDailyCount}/${userDailyCap}`)
      return res.status(200).json({
        error:        "You've chatted enough with the agents today. Come back tomorrow.",
        isCapHit:     true,
        capHitReason: 'user_daily_limit',
      })
    }

    // ── 11. Per-post + per-agent-per-user cap checks (parallel) ──
    const [postCount, userCount] = await Promise.all([
      countPostAgentReplies(postId!),
      countAgentRepliesToUser(postId!, userId!, taggedAgent!),
    ])

    console.log(`[agent-reply] post=${postId} agent=${taggedAgent} postCount=${postCount} userCount=${userCount}`)

    // ── 12a. Per-post cap hit ──────────────────────────────────
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
      const { text: capText, costCents: capCost } = await callClaude(taggedAgent!, 'cap_hit')
      const row     = await insertAgentReply({
        postId:           postId!,
        topLevelParentId: topLevelParentId,
        agentName:        taggedAgent!,
        content:          capText,
        isPinned:         true,
      })
      await incrementTodaySpendCents(capCost)
      return res.status(200).json({
        success:      true,
        replyId:      row.id,
        replyContent: capText,
        isCapHit:     true,
        isPinned:     true,
        capHitReason: 'per_post',
      } as AgentReplyResponse)
    }

    // ── 12b. Per-user cap hit (ephemeral — no DB insert, no Claude call) ──
    // Private signal to this user only; no row is written to replies.
    if (userCount >= AGENT_REPLIES_PER_USER_PER_POST_LIMIT) {
      return res.status(200).json({
        success:      true,
        replyContent: FALLBACK_CAP_HIT_MESSAGES[taggedAgent!] ?? "You've chatted enough here.",
        isCapHit:     true,
        isPinned:     false,
        capHitReason: 'per_user',
      } as AgentReplyResponse)
    }

    // ── 12c. Normal reply ──────────────────────────────────────
    // Fetch conversation thread for context (last 8 messages, chronological)
    const threadMessages = await fetchThreadMessages(topLevelParentId)
    const threadContext = formatThreadForPrompt(threadMessages, taggedAgent!)

    // isFinalAllowedReply: userCount is currently 4, meaning THIS reply is the
    // 5th (allowed). The 6th would be a cap hit, so we prompt a natural close.
    const isFinalAllowedReply = userCount === AGENT_REPLIES_PER_USER_PER_POST_LIMIT - 1
    const { text: replyText, costCents: replyCost } = await callClaude(taggedAgent!, 'normal', {
      postHeadline:  postHeadline!,
      postBody:      postBody!,
      userComment:   userReplyContent!,
      threadContext: threadContext || undefined,
      isFinalReply:  isFinalAllowedReply,
    })
    const row = await insertAgentReply({
      postId:           postId!,
      topLevelParentId: topLevelParentId,
      agentName:        taggedAgent!,
      content:          replyText,
      isPinned:         false,
    })
    await incrementTodaySpendCents(replyCost)

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
