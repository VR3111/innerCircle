import { AGENT_PERSONALITIES, type AgentPersonality } from './_agents/personalities'
import { AGENT_NAMES }           from './_agents/constants'
import { fetchTopHeadlines }     from './_lib/newsapi'
import { generatePost }          from './_lib/claude'
import { fetchImage }            from './_lib/unsplash'
import { getSupabaseAdmin }      from './_lib/supabase-admin'
import { computeCostCents }      from './_lib/call-claude'
import { incrementTodaySpendCents } from './_lib/daily-spend'

// Tell Vercel to use Node.js runtime and allow up to 60s (Hobby plan max).
// Without maxDuration the default is 10s — not enough for 6 sequential agents.
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

async function runAgent(personality: AgentPersonality): Promise<AgentResult> {
  try {
    // 1. Deduplication guard
    const alreadyPosted = await hasRecentPost(personality.id)
    if (alreadyPosted) {
      return { agent: personality.id, status: 'skipped', reason: `Posted within last ${MIN_HOURS_BETWEEN_POSTS}h` }
    }

    // 2. Fetch news headlines
    const articles = await fetchTopHeadlines(personality.newsQuery)
    if (articles.length === 0) {
      return { agent: personality.id, status: 'error', reason: 'No news articles returned' }
    }

    // 3. Generate post with Claude
    const { headline, body, usage } = await generatePost(personality, articles)

    // 4. Track cost in daily_spend
    const costCents = computeCostCents(usage)
    await incrementTodaySpendCents(costCents)

    // 5. Fetch image from Unsplash (non-fatal if it fails)
    const imageUrl = await fetchImage(personality.imageKeywords)

    // 6. Insert post into Supabase
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .insert({
        agent_id:  personality.id,
        headline,
        body,
        image_url: imageUrl,
      })
      .select('id')
      .single()

    if (error) {
      return { agent: personality.id, status: 'error', reason: `DB insert failed: ${error.message}` }
    }

    return {
      agent:    personality.id,
      status:   'posted',
      postId:   data.id,
      headline,
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
      'NEWS_API_KEY',
    ].filter(k => !process.env[k])

    if (missingVars.length > 0) {
      console.error('[generate-posts] Missing env vars:', missingVars.join(', '))
      return res.status(500).json({ error: `Missing env vars: ${missingVars.join(', ')}` })
    }

    // Only allow GET (cron) or POST (manual trigger)
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const startedAt = Date.now()
    const results: AgentResult[] = []

    // Run agents sequentially so external API rate limits are respected
    for (const agent of ALL_AGENTS) {
      const result = await runAgent(agent)
      results.push(result)
      console.log(
        `[generate-posts] ${agent.id}: ${result.status}` +
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
