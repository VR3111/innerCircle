import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AGENTS, type AgentMeta } from '../lib/agents'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentData {
  id:          string
  name:        string
  category:    string
  color:       string
  tagline:     string | null
  followers:   number
  posts_count: number
  rank:        number | null
}

export interface UseAgentResult {
  agent:   AgentData | null
  loading: boolean
  error:   string | null
  refetch: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgent(agentId: string): UseAgentResult {
  const { session } = useAuth()

  const [agent, setAgent]     = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const normalizedId = agentId.toLowerCase()
  const meta: AgentMeta | null = AGENTS.find(a => a.id === normalizedId) ?? null

  const fetchAgent = useCallback(async () => {
    if (!meta) {
      setAgent(null)
      setError('Agent not found')
      setLoading(false)
      return
    }

    if (!session?.access_token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/agents?id=eq.${normalizedId}&select=followers,posts_count,rank,tagline`,
        {
          headers: {
            apikey:        SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      )

      if (!res.ok) {
        setError(`Failed to load agent (${res.status})`)
        setLoading(false)
        return
      }

      const rows = await res.json() as Array<{
        followers: number
        posts_count: number
        rank: number
        tagline: string
      }>

      if (rows.length === 0) {
        setError('Agent not found')
        setLoading(false)
        return
      }

      const row = rows[0]
      setAgent({
        id:          meta.id,
        name:        meta.name,
        category:    meta.category,
        color:       meta.color,
        tagline:     row.tagline || null,
        followers:   row.followers,
        posts_count: row.posts_count,
        rank:        row.rank === 99 ? null : row.rank,
      })
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent')
      setLoading(false)
    }
  }, [normalizedId, meta, session?.access_token])

  useEffect(() => {
    void fetchAgent()
  }, [fetchAgent])

  return { agent, loading, error, refetch: fetchAgent }
}
