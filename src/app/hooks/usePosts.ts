import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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

// Fetches posts from Supabase ordered newest-first.
// Pass agentId to scope to a single agent's posts.
export function usePosts(agentId?: string) {
  const [posts, setPosts] = useState<PostWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        console.log('[usePosts] fetching posts…', { agentId: agentId ?? 'all' })

        // Build query inline to avoid the type-reassignment issue with the
        // Supabase builder — each chain step returns a new typed object.
        const { data, error: err } = await (
          agentId
            ? supabase
                .from('posts')
                .select('*')
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })
            : supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
        )

        if (cancelled) return

        console.log('[usePosts] result:', { count: data?.length ?? 0, err })

        if (err) {
          console.error('[usePosts] Supabase error:', err.message, err.code)
          setError(err.message)
          setLoading(false)
          return
        }

        // Map DB rows → Post shape that PostCard already understands.
        // Rows whose agent_id doesn't match a known agent are silently skipped.
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
        if (cancelled) return
        console.error('[usePosts] unexpected error:', err?.message ?? err)
        setError(err?.message ?? 'Failed to load posts')
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [agentId])

  return { posts, loading, error }
}
