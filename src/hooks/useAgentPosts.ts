import { useState, useEffect } from 'react'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface AgentPost {
  id:       string
  imageUrl: string
}

/** Rewrite Unsplash w= param to a smaller size for grid thumbnails. */
function thumbUrl(url: string): string {
  return url.includes('w=') ? url.replace(/w=\d+/, 'w=400') : url
}

/**
 * Fetches agent-authored posts (user_id IS NULL) for a given agent.
 * Returns only the fields the profile grid needs: id + image_url.
 */
export function useAgentPosts(agentId: string | null) {
  const [posts, setPosts]     = useState<AgentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) {
      setPosts([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const url = new URL(`${SUPABASE_URL}/rest/v1/posts`)
    url.searchParams.set('select', 'id,image_url')
    url.searchParams.set('agent_id', `eq.${agentId}`)
    url.searchParams.set('user_id', 'is.null')
    url.searchParams.set('order', 'created_at.desc')

    fetch(url.toString(), {
      headers: {
        apikey:        SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load posts (${res.status})`)
        return res.json()
      })
      .then((rows: Array<{ id: string; image_url: string }>) => {
        if (cancelled) return
        setPosts(rows.map(r => ({ id: r.id, imageUrl: thumbUrl(r.image_url ?? '') })))
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load posts')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [agentId])

  return { posts, loading, error }
}
