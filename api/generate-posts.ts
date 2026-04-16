import { baron }   from './agents/baron'
import { blitz }   from './agents/blitz'
import { circuit } from './agents/circuit'
import { reel }    from './agents/reel'
import { pulse }   from './agents/pulse'
import { atlas }   from './agents/atlas'
import { fetchTopHeadlines } from './lib/newsapi'
import { generatePost }      from './lib/claude'
import { fetchImage }        from './lib/unsplash'
import { supabaseAdmin }     from './lib/supabase-admin'
import type { AgentConfig }  from './agents/types'

const ALL_AGENTS = [baron, blitz, circuit, reel, pulse, atlas]

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
  const { data } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('agent_id', agentId)
    .gte('created_at', since)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function runAgent(config: AgentConfig): Promise<AgentResult> {
  try {
    // 1. Deduplication guard
    const alreadyPosted = await hasRecentPost(config.id)
    if (alreadyPosted) {
      return { agent: config.id, status: 'skipped', reason: `Posted within last ${MIN_HOURS_BETWEEN_POSTS}h` }
    }

    // 2. Fetch news headlines
    const articles = await fetchTopHeadlines(config.newsQuery)
    if (articles.length === 0) {
      return { agent: config.id, status: 'error', reason: 'No news articles returned' }
    }

    // 3. Generate post with Claude
    const { headline, body } = await generatePost(config.name, config.personality, articles)

    // 4. Fetch image from Unsplash (non-fatal if it fails)
    const imageUrl = await fetchImage(config.imageKeywords)

    // 5. Insert post into Supabase
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        agent_id:  config.id,
        headline,
        body,
        image_url: imageUrl,
      })
      .select('id')
      .single()

    if (error) {
      return { agent: config.id, status: 'error', reason: `DB insert failed: ${error.message}` }
    }

    // 6. Increment agent post count (best-effort)
    await supabaseAdmin.rpc('adjust_agent_posts' as any, { p_agent_id: config.id, p_delta: 1 }).catch(() => {})

    return {
      agent:    config.id,
      status:   'posted',
      postId:   data.id,
      headline,
    }
  } catch (err: any) {
    return {
      agent:  config.id,
      status: 'error',
      reason: err?.message ?? String(err),
    }
  }
}

// ── Vercel serverless handler ─────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  // Verify caller is Vercel Cron or an authorized manual trigger
  const auth = req.headers['authorization'] ?? ''
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret || auth !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Only allow GET (cron) or POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startedAt = Date.now()
  const results: AgentResult[] = []

  // Run agents sequentially so API rate limits are respected
  for (const agent of ALL_AGENTS) {
    const result = await runAgent(agent)
    results.push(result)
    console.log(`[generate-posts] ${agent.id}: ${result.status}${result.reason ? ` — ${result.reason}` : ''}${result.headline ? ` — "${result.headline}"` : ''}`)
  }

  const summary = {
    ranAt:    new Date().toISOString(),
    duration: `${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
    posted:   results.filter(r => r.status === 'posted').length,
    skipped:  results.filter(r => r.status === 'skipped').length,
    errors:   results.filter(r => r.status === 'error').length,
    results,
  }

  return res.status(200).json(summary)
}
