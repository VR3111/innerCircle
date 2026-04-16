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

      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (agentId) {
        query = query.eq('agent_id', agentId)
      }

      const { data, error: err } = await query

      if (cancelled) return

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      // Map DB rows to the Post shape PostCard already understands
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

      setPosts(mapped)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [agentId])

  return { posts, loading, error }
}
