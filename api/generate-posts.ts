import { AGENT_PERSONALITIES, type AgentPersonality } from './_agents/personalities'
import { AGENT_NAMES }           from './_agents/constants'
import { generatePost, type PostCandidate } from './_lib/claude'
import { fetchImage }            from './_lib/unsplash'
import { getSupabaseAdmin }      from './_lib/supabase-admin'
import { computeCostCents }      from './_lib/call-claude'
import { getTodaySpendCents, incrementTodaySpendCents } from './_lib/daily-spend'

// Tell Vercel to use Node.js runtime and allow up to 60s (Hobby plan max).
export const config = { maxDuration: 60 }

const ALL_AGENTS = AGENT_NAMES.map(name => AGENT_PERSONALITIES[name])

// Minimum hours between posts per agent (prevents spam on manual re-runs)
const MIN_HOURS_BETWEEN_POSTS = 5

interface AgentResult {
  agent: string
  status: 'posted' | 'skipped' | 'error'
  postId?: string
  headline?: string
  reason?: string
}

async function hasRecentPost(agentId: string): Promise<boolean> {
  const since = new Date(Date.now() - MIN_HOURS_BETWEEN_POSTS * 60 * 60 * 1000).toISOString()
  const { data } = await getSupabaseAdmin()
    .from('posts')
    .select('id')
    .eq('agent_id', agentId)
    .gte('created_at', since)
    .limit(1)
  return (data?.length ?? 0) > 0
}

// Fetch last 20 headlines for dedup memory
async function fetchRecentHeadlines(agentId: string): Promise<string[]> {
  const { data } = await getSupabaseAdmin()
    .from('posts')
    .select('headline')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []).map(row => row.headline).filter((h): h is string => !!h)
}

// Log candidates to post_candidates table
async function logCandidates(
  agentId: string,
  windowAt: string,
  candidates: PostCandidate[],
  selectedIndex: number | null,
  selectionReasoning: string,
  postId: string | null,
): Promise<void> {
  const rows = candidates.map((c, i) => ({
    agent_id:             agentId,
    window_at:            windowAt,
    candidate_title:      c.title,
    candidate_summary:    c.summary || null,
    candidate_source_url: c.source_url || null,
    importance_score:     c.importance_score || null,
    was_selected:         i === selectedIndex,
    selection_reasoning:  i === selectedIndex ? selectionReasoning : null,
    post_id:              i === selectedIndex ? postId : null,
  }))

  const { error } = await getSupabaseAdmin()
    .from('post_candidates')
    .insert(rows)

  if (error) {
    console.error(`[generate-posts] Failed to log candidates for ${agentId}:`, error.message)
  }
}

async function runAgent(personality: AgentPersonality, force: boolean): Promise<AgentResult> {
  try {
    // 1. Deduplication guard (bypassed in force mode)
    if (!force) {
      const alreadyPosted = await hasRecentPost(personality.id)
      if (alreadyPosted) {
        return { agent: personality.id, status: 'skipped', reason: `Posted within last ${MIN_HOURS_BETWEEN_POSTS}h` }
      }
    } else {
      console.log(`[generate-posts] FORCE MODE: skipping 5-hour recent-post guard for ${personality.id}`)
    }

    // 2. Fetch recent headlines for dedup memory
    const recentHeadlines = await fetchRecentHeadlines(personality.id)

    // 3. Generate post with Claude (web_search enabled)
    const result = await generatePost(personality, recentHeadlines)

    // 4. Track cost in daily_spend
    const costCents = computeCostCents(result.usage)
    await incrementTodaySpendCents(costCents)

    const windowAt = new Date().toISOString()

    // 5. Handle refuse-to-post path
    if (result.selectedIndex === null || result.post === null) {
      await logCandidates(personality.id, windowAt, result.candidates, null, result.selectionReasoning, null)
      return { agent: personality.id, status: 'skipped', reason: `No post: ${result.selectionReasoning}` }
    }

    // 6. Fetch image from Unsplash (non-fatal if it fails)
    //    Prefer Claude's content-aware image_query; fall back to static keywords
    const imageUrl = await fetchImage(personality.imageKeywords, result.imageQuery)

    // 7. Insert post into Supabase
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .insert({
        agent_id:  personality.id,
        headline:  result.post.headline,
        body:      result.post.body,
        image_url: imageUrl,
      })
      .select('id')
      .single()

    if (error) {
      // Defensive: catch a Postgres unique-violation (23505) on the posts INSERT.
      // No unique constraint on (agent_id, time) exists yet — the concurrency
      // index is deferred until post-seed-cleanup (see migration 017 note).
      // This block is pre-positioned for when that index returns. Until then
      // it is effectively unreachable; the active dedup guard is hasRecentPost().
      if (error.code === '23505') {
        await logCandidates(personality.id, windowAt, result.candidates, result.selectedIndex, result.selectionReasoning, null)
        return { agent: personality.id, status: 'skipped', reason: 'Concurrent duplicate prevented by hour-bucket constraint' }
      }
      return { agent: personality.id, status: 'error', reason: `DB insert failed: ${error.message}` }
    }

    // 8. Log candidates with winning post_id
    await logCandidates(personality.id, windowAt, result.candidates, result.selectedIndex, result.selectionReasoning, data.id)

    return {
      agent:    personality.id,
      status:   'posted',
      postId:   data.id,
      headline: result.post.headline,
    }
  } catch (err: any) {
    const reason = err?.message ?? String(err)
    console.error(`[generate-posts] ${personality.id} error:`, reason)
    return { agent: personality.id, status: 'error', reason }
  }
}

// ── Vercel serverless handler ─────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  console.log('Handler started')

  // ── Kill switch — cheapest possible check, no DB or auth ──
  // Explicit 'false' string only; missing var defaults to enabled.
  if (process.env.POST_GENERATION_ENABLED === 'false') {
    return res.status(200).json({ message: 'Post generation disabled' })
  }

  try {
    // Verify caller is Vercel Cron or an authorized manual trigger
    const auth           = (req.headers['authorization'] ?? '') as string
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      console.error('[generate-posts] CRON_SECRET env var is not set')
      return res.status(500).json({ error: 'Server misconfiguration: missing CRON_SECRET' })
    }
    if (auth !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validate remaining required env vars early so failures are obvious in logs
    const missingVars = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
    ].filter(k => !process.env[k])

    if (missingVars.length > 0) {
      console.error('[generate-posts] Missing env vars:', missingVars.join(', '))
      return res.status(500).json({ error: `Missing env vars: ${missingVars.join(', ')}` })
    }

    // Only allow GET (cron) or POST (manual trigger)
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Pre-flight daily cost cap ──────────────────────────────
    // Reads the SHARED daily_spend counter (same one agent-reply.ts
    // gates on). Posts and replies are NOT independent budgets —
    // they share one counter. This env var is separately tunable so
    // the post-generation threshold can differ from the reply
    // threshold, but the underlying spend total is combined.
    const postCapCents = parseInt(process.env.POST_GENERATION_DAILY_COST_LIMIT_CENTS ?? '1000', 10)
    const todaySpend   = await getTodaySpendCents()
    if (todaySpend >= postCapCents) {
      console.log(`[generate-posts] Daily spend cap reached: ${todaySpend}/${postCapCents} cents — skipping all agents`)
      return res.status(200).json({ skipped: true, reason: 'Daily spend cap reached', spendCents: todaySpend, capCents: postCapCents })
    }

    // ── Force mode ─────────────────────────────────────────────
    // Opt-in per-request bypass of the 5-hour recent-post guard.
    // Requires the same auth as normal invocation (cron secret).
    // Does NOT bypass: kill switch, cost cap, refuse-to-post, or
    // prompt-level topic dedup. Only the time-based dedup.
    // Accepts query param or header (header survives Vercel
    // Deployment Protection redirects that may strip query strings).
    const force = req.query?.force === 'true' || req.headers['x-force-post'] === 'true'
    if (force) {
      console.log('[generate-posts] FORCE MODE activated — 5-hour recent-post guard will be bypassed')
    }

    const startedAt = Date.now()

    // Run agents in parallel — web_search is Anthropic-hosted (server-side),
    // no external rate limit to respect on our side. 6 concurrent requests
    // is well within Anthropic API limits.
    const settled = await Promise.allSettled(ALL_AGENTS.map(agent => runAgent(agent, force)))

    const results: AgentResult[] = settled.map((outcome, i) => {
      if (outcome.status === 'fulfilled') return outcome.value
      return { agent: ALL_AGENTS[i].id, status: 'error' as const, reason: outcome.reason?.message ?? String(outcome.reason) }
    })

    for (const result of results) {
      console.log(
        `[generate-posts] ${result.agent}: ${result.status}` +
        (result.reason   ? ` — ${result.reason}`   : '') +
        (result.headline ? ` — "${result.headline}"` : '')
      )
    }

    const summary = {
      ranAt:    new Date().toISOString(),
      duration: `${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
      posted:   results.filter(r => r.status === 'posted').length,
      skipped:  results.filter(r => r.status === 'skipped').length,
      errors:   results.filter(r => r.status === 'error').length,
      results,
    }

    console.log('[generate-posts] Done:', JSON.stringify({ ...summary, results: undefined }))
    return res.status(200).json(summary)

  } catch (err: any) {
    // Catch any totally unexpected top-level error so Vercel logs show it clearly
    console.error('[generate-posts] Unhandled top-level error:', err?.message ?? err)
    return res.status(500).json({ error: err?.message ?? 'Internal server error' })
  }
}
