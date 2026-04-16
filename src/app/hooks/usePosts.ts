import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { agents } from '../data/mockData'
import type { Post, Agent } from '../data/mockData'

export interface PostWithAgent {
  post: Post
  agent: Agent
}

function timeAgo(isoString: string): string {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (secs < 60)    return 'just now'
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Fetches posts via the PostgREST REST API directly, bypassing the Supabase JS
// client's internal auth-initialization queue that causes queries to hang when
// called before getSession() has resolved.
//
// Pass agentId to scope results to a single agent's posts.
export function usePosts(agentId?: string) {
  // Fix #2 — wait for auth session to settle before querying.
  // The Supabase JS client queues all requests until getSession() resolves.
  // Reading authLoading here lets us gate the fetch on auth being ready,
  // and re-run the effect the moment it becomes false.
  const { loading: authLoading } = useAuth()

  const [posts, setPosts] = useState<PostWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return   // auth not ready yet — effect will re-run when it is

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function load() {
      setLoading(true)
      setError(null)

      // Fix #1 — 10-second timeout so the spinner never hangs forever
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.error('[usePosts] Query timed out after 10s')
          setError('Request timed out — check your connection')
          setLoading(false)
        }
      }, 10_000)

      try {
        console.log('[usePosts] fetching posts…', { agentId: agentId ?? 'all' })

        // Fix #3 — use the PostgREST REST API directly.
        // This bypasses the Supabase JS client entirely, so there is no
        // auth-header initialization step that could cause the hang.
        const url = new URL(`${SUPABASE_URL}/rest/v1/posts`)
        url.searchParams.set('select', '*')
        url.searchParams.set('order', 'created_at.desc')
        if (agentId) url.searchParams.set('agent_id', `eq.${agentId}`)

        console.log('[usePosts] direct fetch url:', url.toString())

        const res = await fetch(url.toString(), {
          headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type':  'application/json',
          },
        })

        clearTimeout(timeoutId)
        if (cancelled) return

        console.log('[usePosts] direct fetch status:', res.status)

        if (!res.ok) {
          const body = await res.text()
          console.error('[usePosts] REST error:', res.status, body)
          setError(`Failed to load posts (${res.status})`)
          setLoading(false)
          return
        }

        const data = await res.json() as any[]
        console.log('[usePosts] rows returned:', data?.length ?? 0)

        // Map DB rows → Post shape that PostCard already understands
        const mapped: PostWithAgent[] = (data ?? []).flatMap(row => {
          const agent = agents.find(a => a.id === row.agent_id)
          if (!agent) return []

          const post: Post = {
            id:        row.id,
            agentId:   row.agent_id,
            headline:  row.headline,
            caption:   row.body,
            image:     row.image_url ?? '',
            reactions: row.likes,
            replies:   row.comments,
            shares:    row.shares,
            timestamp: timeAgo(row.created_at),
          }

          return [{ post, agent }]
        })

        console.log('[usePosts] mapped posts:', mapped.length)
        setPosts(mapped)
        setLoading(false)

      } catch (err: any) {
        clearTimeout(timeoutId)
        if (cancelled) return
        console.error('[usePosts] unexpected error:', err?.message ?? err)
        setError(err?.message ?? 'Failed to load posts')
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [agentId, authLoading])

  return { posts, loading, error }
}
