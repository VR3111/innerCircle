import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface FollowContextType {
  followedIds: Set<string>
  loading: boolean
  isFollowing: (agentId: string) => boolean
  followAgent: (agentId: string) => Promise<void>
  unfollowAgent: (agentId: string) => Promise<void>
}

const FollowContext = createContext<FollowContextType>({
  followedIds: new Set(),
  loading: true,
  isFollowing: () => false,
  followAgent: async () => {},
  unfollowAgent: async () => {},
})

export function FollowProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !session?.access_token) {
      setFollowedIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    const token = session.access_token

    fetch(
      `${SUPABASE_URL}/rest/v1/follows?user_id=eq.${user.id}&select=agent_id`,
      {
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { agent_id: string }[]) => {
        setFollowedIds(new Set(data.map((f) => f.agent_id)))
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [user?.id, session?.access_token])

  const isFollowing = useCallback(
    (agentId: string) => followedIds.has(agentId),
    [followedIds],
  )

  const followAgent = useCallback(
    async (agentId: string) => {
      if (!user || !session?.access_token) return
      const token = session.access_token

      // Optimistic
      setFollowedIds((prev) => new Set([...prev, agentId]))

      const res = await fetch(`${SUPABASE_URL}/rest/v1/follows`, {
        method: 'POST',
        headers: {
          apikey:         SUPABASE_ANON_KEY,
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer:         'return=minimal',
        },
        body: JSON.stringify({ user_id: user.id, agent_id: agentId }),
      })

      if (!res.ok) {
        // Revert
        setFollowedIds((prev) => {
          const next = new Set(prev)
          next.delete(agentId)
          return next
        })
        return
      }

      // Fire-and-forget: bump agents.followers counter
      void fetch(`${SUPABASE_URL}/rest/v1/rpc/adjust_agent_followers`, {
        method: 'POST',
        headers: {
          apikey:         SUPABASE_ANON_KEY,
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_agent_id: agentId, p_delta: 1 }),
      })
    },
    [user, session?.access_token],
  )

  const unfollowAgent = useCallback(
    async (agentId: string) => {
      if (!user || !session?.access_token) return
      const token = session.access_token

      // Optimistic
      setFollowedIds((prev) => {
        const next = new Set(prev)
        next.delete(agentId)
        return next
      })

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/follows?user_id=eq.${user.id}&agent_id=eq.${agentId}`,
        {
          method: 'DELETE',
          headers: {
            apikey:         SUPABASE_ANON_KEY,
            Authorization:  `Bearer ${token}`,
            Prefer:         'return=minimal',
          },
        },
      )

      if (!res.ok) {
        // Revert
        setFollowedIds((prev) => new Set([...prev, agentId]))
        return
      }

      // Fire-and-forget: decrement agents.followers counter
      void fetch(`${SUPABASE_URL}/rest/v1/rpc/adjust_agent_followers`, {
        method: 'POST',
        headers: {
          apikey:         SUPABASE_ANON_KEY,
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_agent_id: agentId, p_delta: -1 }),
      })
    },
    [user, session?.access_token],
  )

  return (
    <FollowContext.Provider
      value={{ followedIds, loading, isFollowing, followAgent, unfollowAgent }}
    >
      {children}
    </FollowContext.Provider>
  )
}

export const useFollow = () => useContext(FollowContext)
