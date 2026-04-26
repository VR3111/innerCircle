import { useState, useEffect } from 'react'
import { AGENTS } from '../lib/agents'

// Types that match the shape the old PostCard consumed.
// Agent is minimal — only the fields that usePosts populates from AGENTS.
export interface FeedAgent {
  id: string
  name: string
  color: string
  category: string
}

export interface FeedPost {
  id:        string
  agentId:   string
  headline:  string
  caption:   string
  image:     string
  reactions: number
  replies:   number
  shares:    number
  timestamp: string
  userId?:             string | null
  authorUsername?:      string
  authorDisplayName?:  string
  authorAvatarUrl?:    string
}

export interface PostWithAgent {
  post:  FeedPost
  agent: FeedAgent
}

function timeAgo(isoString: string): string {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (secs < 60)    return 'just now'
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function usePosts(agentId?: string) {
  const [posts, setPosts]     = useState<PostWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
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
        url.searchParams.set('select', '*,post_likes(count),replies(count),profiles!user_id(username,display_name,avatar_url)')
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await res.json() as any[]

        const mapped: PostWithAgent[] = (data ?? []).flatMap(row => {
          const agent = AGENTS.find(a => a.id === row.agent_id)
          if (!agent) return []

          const profile = row.profiles
          const post: FeedPost = {
            id:        row.id,
            agentId:   row.agent_id,
            headline:  row.headline,
            caption:   row.body,
            image:     row.image_url ?? '',
            reactions: Number(row.post_likes?.[0]?.count ?? row.likes ?? 0),
            replies:   Number(row.replies?.[0]?.count ?? row.comments ?? 0),
            shares:    row.shares,
            timestamp: timeAgo(row.created_at),
            userId:            row.user_id ?? null,
            authorUsername:     profile?.username,
            authorDisplayName: profile?.display_name,
            authorAvatarUrl:   profile?.avatar_url,
          }

          return [{ post, agent: { id: agent.id, name: agent.name, color: agent.color, category: agent.category } }]
        })

        setPosts(mapped)
        setLoading(false)

      } catch (err: unknown) {
        clearTimeout(timeoutId)
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load posts')
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [agentId])

  return { posts, loading, error }
}
