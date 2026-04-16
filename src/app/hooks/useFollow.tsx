import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface FollowContextType {
  /** Set of agent IDs the current user follows */
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
  const { user } = useAuth()
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Load the user's follows on mount / when the user ID changes (sign in or out).
  // Deliberately depends on user?.id rather than user — Supabase fires
  // onAuthStateChange on every token refresh, producing a new user object each
  // time. Using the full user object as a dependency would re-run this effect
  // on every refresh, overwriting any optimistic follow/unfollow updates.
  useEffect(() => {
    if (!user) {
      setFollowedIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('follows')
      .select('agent_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setFollowedIds(new Set(data?.map((f) => f.agent_id) ?? []))
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const isFollowing = useCallback(
    (agentId: string) => followedIds.has(agentId),
    [followedIds],
  )

  const followAgent = useCallback(
    async (agentId: string) => {
      if (!user) return

      // Optimistic update
      setFollowedIds((prev) => new Set([...prev, agentId]))

      const { error } = await supabase
        .from('follows')
        .insert({ user_id: user.id, agent_id: agentId })

      if (error) {
        // Rollback
        setFollowedIds((prev) => {
          const next = new Set(prev)
          next.delete(agentId)
          return next
        })
        return
      }

      // Increment agent follower count atomically via RPC
      await supabase.rpc('adjust_agent_followers', { p_agent_id: agentId, p_delta: 1 })
    },
    [user],
  )

  const unfollowAgent = useCallback(
    async (agentId: string) => {
      if (!user) return

      // Optimistic update
      setFollowedIds((prev) => {
        const next = new Set(prev)
        next.delete(agentId)
        return next
      })

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_id', agentId)

      if (error) {
        // Rollback
        setFollowedIds((prev) => new Set([...prev, agentId]))
        return
      }

      // Decrement agent follower count atomically via RPC
      await supabase.rpc('adjust_agent_followers', { p_agent_id: agentId, p_delta: -1 })
    },
    [user],
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
