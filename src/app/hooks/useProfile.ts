import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { agents } from '../data/mockData'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileData {
  id:                    string
  username:              string
  display_name:          string | null
  bio:                   string | null
  avatar_url:            string | null
  is_inner_circle:       boolean
  signal_score:          number
  posts_count:           number
  followers_count:       number
  user_following_count:  number
  // Added for Creators Club visual path.
  // DB column does not exist until Step 6 (Leaderboard) — query returns undefined,
  // which we coerce to null in mapProfile(). Code path exists; badge never fires
  // until the column is backfilled.
  creators_club_category: string | null
}

export interface UserPost {
  id:         string
  agent_id:   string
  headline:   string
  image_url:  string | null
  created_at: string
  likes:      number
  comments:   number
}

export interface ArenaCategory {
  agent_id:   string
  name:       string
  color:      string
  post_count: number
}

export interface UseProfileResult {
  profile:             ProfileData | null
  agentFollowingCount: number
  followingCountTotal: number
  userPosts:           UserPost[]
  arenasCategories:    ArenaCategory[]
  loading:             boolean
  error:               string | null
  refetch:             () => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseContentRangeCount(header: string | null): number {
  // Supabase returns "0-N/total" or "*/0" — we want the total after "/".
  if (!header) return 0
  const parts = header.split('/')
  const total = parseInt(parts[1] ?? '0', 10)
  return isNaN(total) ? 0 : total
}

function computeArenas(posts: UserPost[]): ArenaCategory[] {
  // Group posts by agent_id (= category tag), count per group.
  const grouped = new Map<string, number>()
  for (const post of posts) {
    grouped.set(post.agent_id, (grouped.get(post.agent_id) ?? 0) + 1)
  }

  const result: ArenaCategory[] = []
  for (const [agentId, count] of grouped) {
    const agent = agents.find(a => a.id === agentId)
    result.push({
      agent_id:   agentId,
      name:       agent?.name  ?? agentId,
      color:      agent?.color ?? '#666666',
      post_count: count,
    })
  }

  // Most-posted category first.
  result.sort((a, b) => b.post_count - a.post_count)
  return result
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile(userId: string): UseProfileResult {
  const { session } = useAuth()
  const navigate    = useNavigate()
  const abortRef    = useRef<AbortController | null>(null)

  const [profile,             setProfile]             = useState<ProfileData | null>(null)
  const [agentFollowingCount, setAgentFollowingCount] = useState(0)
  const [userPosts,           setUserPosts]           = useState<UserPost[]>([])
  const [loading,             setLoading]             = useState(true)
  const [error,               setError]               = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId || !session?.access_token) return

    abortRef.current?.abort()
    const controller  = new AbortController()
    abortRef.current  = controller
    const accessToken = session.access_token

    // 10-second timeout across all three requests.
    const timeoutId = setTimeout(() => controller.abort(), 10_000)

    setLoading(true)
    setError(null)

    const headers: HeadersInit = {
      apikey:         SUPABASE_ANON_KEY,
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    try {
      const [profileRes, followsRes, postsRes] = await Promise.all([
        // 1. Own profile row with all new columns.
        //    creators_club_category is not in DB until Step 6 (Leaderboard) —
        //    including it in select is harmless (Supabase ignores unknown columns
        //    in the response object, so it will just be absent / undefined).
        fetch(
          `${SUPABASE_URL}/rest/v1/profiles` +
          `?id=eq.${userId}` +
          `&select=id,username,display_name,bio,avatar_url,is_inner_circle,signal_score,posts_count,followers_count,user_following_count,creators_club_category`,
          { signal: controller.signal, headers }
        ),
        // 2. Agent follows — we only need the count (limit=0 + Prefer: count=exact).
        fetch(
          `${SUPABASE_URL}/rest/v1/follows?user_id=eq.${userId}&select=id&limit=0`,
          {
            signal:  controller.signal,
            headers: { ...headers, Prefer: 'count=exact' },
          }
        ),
        // 3. User-authored posts, newest first.
        fetch(
          `${SUPABASE_URL}/rest/v1/posts` +
          `?user_id=eq.${userId}` +
          `&select=id,agent_id,headline,image_url,created_at,likes,comments` +
          `&order=created_at.desc`,
          { signal: controller.signal, headers }
        ),
      ])

      clearTimeout(timeoutId)

      // 401 from any request → session expired, redirect to auth.
      if (
        profileRes.status === 401 ||
        followsRes.status === 401 ||
        postsRes.status  === 401
      ) {
        navigate('/auth', { replace: true })
        return
      }

      if (!profileRes.ok) {
        setError(`Profile fetch failed (${profileRes.status})`)
        return
      }

      // creators_club_category won't exist in the DB response until Step 6.
      // Coerce undefined → null so the type contract is satisfied.
      const rawRows = await profileRes.json() as Array<Omit<ProfileData, 'creators_club_category'> & { creators_club_category?: string | null }>
      const profileRows: ProfileData[] = rawRows.map(r => ({
        ...r,
        creators_club_category: r.creators_club_category ?? null,
      }))

      const postsRows  = postsRes.ok ? (await postsRes.json() as UserPost[]) : []
      const agentCount = parseContentRangeCount(followsRes.headers.get('Content-Range'))

      setProfile(profileRows[0] ?? null)
      setAgentFollowingCount(agentCount)
      setUserPosts(postsRows)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [userId, session?.access_token, navigate])

  useEffect(() => {
    void fetchProfile()
    return () => { abortRef.current?.abort() }
  }, [fetchProfile])

  const followingCountTotal = (profile?.user_following_count ?? 0) + agentFollowingCount
  const arenasCategories    = computeArenas(userPosts)

  return {
    profile,
    agentFollowingCount,
    followingCountTotal,
    userPosts,
    arenasCategories,
    loading,
    error,
    refetch: fetchProfile,
  }
}
