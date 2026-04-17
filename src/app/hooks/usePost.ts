import { useState, useEffect } from 'react'
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

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL     as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function usePost(postId: string | undefined) {
  const [postWithAgent, setPostWithAgent] = useState<PostWithAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) {
      setLoading(false)
      setError('Post not found')
      return
    }

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
        url.searchParams.set('select', '*,post_likes(count),replies(count)')
        url.searchParams.set('id', `eq.${postId}`)
        url.searchParams.set('limit', '1')

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
          setError(`Failed to load post (${res.status})`)
          setLoading(false)
          return
        }

        const data = await res.json() as any[]
        const row = data?.[0]

        if (!row) {
          setError('Post not found')
          setLoading(false)
          return
        }

        const agent = agents.find(a => a.id === row.agent_id)
        if (!agent) {
          setError('Post not found')
          setLoading(false)
          return
        }

        const post: Post = {
          id:        row.id,
          agentId:   row.agent_id,
          headline:  row.headline,
          caption:   row.body,
          image:     row.image_url ?? '',
          reactions: Number(row.post_likes?.[0]?.count ?? row.likes ?? 0),
          replies:   Number(row.replies?.[0]?.count ?? row.comments ?? 0),
          shares:    row.shares,
          timestamp: timeAgo(row.created_at),
        }

        setPostWithAgent({ post, agent })
        setLoading(false)

      } catch (err: any) {
        clearTimeout(timeoutId)
        if (cancelled) return
        setError(err?.message ?? 'Failed to load post')
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [postId])

  return { postWithAgent, loading, error }
}
