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

// Pass agentId to scope results to a single agent's posts.
export function usePosts(agentId?: string) {
  const { loading: authLoading } = useAuth()

  const [posts, setPosts] = useState<PostWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function load() {
      setLoading(true)
      setError(null)

      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setError('Request timed out — check your connection')
          setLoading(false)
        }
      }, 10_000)

      try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/posts`)
        url.searchParams.set('select', '*')
        url.searchParams.set('order', 'created_at.desc')
        if (agentId) url.searchParams.set('agent_id', `eq.${agentId}`)

        const res = await fetch(url.toString(), {
          headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type':  'application/json',
          },
        })

        clearTimeout(timeoutId)
        if (cancelled) return

        if (!res.ok) {
          setError(`Failed to load posts (${res.status})`)
          setLoading(false)
          return
        }

        const data = await res.json() as any[]

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

        setPosts(mapped)
        setLoading(false)

      } catch (err: any) {
        clearTimeout(timeoutId)
        if (cancelled) return
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
