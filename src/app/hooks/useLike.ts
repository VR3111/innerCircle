import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ensureProfile } from '../../lib/profiles'

interface LikeState {
  isLiked: boolean
  likeCount: number
}

type Listener = () => void

const likeStates = new Map<string, LikeState>()
const likeListeners = new Map<string, Set<Listener>>()
const pendingLikeWrites = new Map<string, boolean>()
const EMPTY_LIKE_STATE: LikeState = { isLiked: false, likeCount: 0 }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function sanitizeLikeCount(value: number) {
  return Number.isFinite(value) ? value : 0
}

function getLikeState(postId: string, initialLikeCount: number): LikeState {
  const existing = likeStates.get(postId)
  if (existing) return existing

  const nextState = {
    isLiked: false,
    likeCount: sanitizeLikeCount(initialLikeCount),
  }
  likeStates.set(postId, nextState)
  return nextState
}

function setLikeState(postId: string, nextState: LikeState) {
  const current = likeStates.get(postId)
  if (
    current &&
    current.isLiked === nextState.isLiked &&
    current.likeCount === nextState.likeCount
  ) {
    return
  }

  likeStates.set(postId, nextState)
  queueMicrotask(() => {
    const listeners = likeListeners.get(postId)
    listeners?.forEach((listener) => listener())
  })
}

function subscribeToLikeState(postId: string, listener: Listener) {
  let listeners = likeListeners.get(postId)
  if (!listeners) {
    listeners = new Set()
    likeListeners.set(postId, listeners)
  }

  listeners.add(listener)
  return () => {
    listeners?.delete(listener)
    if (listeners && listeners.size === 0) {
      likeListeners.delete(postId)
    }
  }
}

async function authedFetch(path: string, accessToken: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

async function fetchIsLiked(postId: string, userId: string, accessToken: string) {
  const params = new URLSearchParams({
    select: 'id',
    user_id: `eq.${userId}`,
    post_id: `eq.${postId}`,
    limit: '1',
  })

  const res = await authedFetch(`post_likes?${params.toString()}`, accessToken)
  if (!res.ok) return false

  const data = await res.json() as Array<{ id: string }>
  return data.length > 0
}

async function runLikeRpc(name: 'increment_likes' | 'decrement_likes', postId: string, accessToken: string) {
  const res = await authedFetch(`rpc/${name}`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ post_id: postId }),
  })
  return res.ok
}

async function insertLike(postId: string, userId: string, accessToken: string) {
  return authedFetch('post_likes', accessToken, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, post_id: postId }),
  })
}

async function deleteLike(postId: string, userId: string, accessToken: string) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    post_id: `eq.${postId}`,
  })

  const res = await authedFetch(`post_likes?${params.toString()}`, accessToken, {
    method: 'DELETE',
  })
  return res.ok
}

export function useLike(postId: string | undefined, initialLikeCount: number) {
  const { user, session, loading: authLoading } = useAuth()
  const state = useSyncExternalStore(
    (onStoreChange) => {
      if (!postId) return () => {}
      return subscribeToLikeState(postId, onStoreChange)
    },
    () => {
      if (!postId) {
        return EMPTY_LIKE_STATE
      }
      return getLikeState(postId, initialLikeCount)
    },
    () => EMPTY_LIKE_STATE
  )

  useEffect(() => {
    if (!postId) {
      return
    }

    getLikeState(postId, initialLikeCount)

    if (!user || !session?.access_token) {
      const current = getLikeState(postId, initialLikeCount)
      setLikeState(postId, { ...current, isLiked: false })
      return
    }
    fetchIsLiked(postId, user.id, session.access_token).then((isLiked) => {
      if (pendingLikeWrites.has(postId)) return
      const current = getLikeState(postId, initialLikeCount)
      setLikeState(postId, { ...current, isLiked })
    })
  // Only postId and user?.id are deps. initialLikeCount, authLoading, and
  // session?.access_token are intentionally excluded:
  // - initialLikeCount only seeds the Map on first call (getLikeState ignores
  //   it if state exists), so prop changes must not re-trigger a DB fetch.
  // - authLoading is covered by the !user guard (AuthContext batches
  //   setUser/setLoading together, so user is null while loading).
  // - session?.access_token changes on every Supabase token refresh (~every few
  //   minutes), which would cause simultaneous re-fetches from every mounted
  //   PostCard. The token is only needed inside fetchIsLiked, not as a trigger.
  //   user?.id already covers the auth-change case.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id])

  const toggleLike = () => {
    if (!user || !postId || !session?.access_token) return

    const current = getLikeState(postId, initialLikeCount)
    const wasLiked = current.isLiked
    const accessToken = session.access_token
    pendingLikeWrites.set(postId, !wasLiked)

    setLikeState(postId, {
      isLiked: !wasLiked,
      likeCount: current.likeCount + (wasLiked ? -1 : 1),
    })

    void (async () => {
      if (!wasLiked) {
        await ensureProfile(user)
        const insertRes = await insertLike(postId, user.id, accessToken)

        if (insertRes.ok) {
          pendingLikeWrites.delete(postId)
          setLikeState(postId, {
            isLiked: true,
            likeCount: current.likeCount + 1,
          })
          void runLikeRpc('increment_likes', postId, accessToken)
          return
        }

        if (insertRes.status === 409) {
          pendingLikeWrites.delete(postId)
          setLikeState(postId, {
            ...current,
            isLiked: true,
          })
          return
        }

        if (!insertRes.ok) {
          pendingLikeWrites.delete(postId)
          setLikeState(postId, current)
        }
      } else {
        const deleted = await deleteLike(postId, user.id, accessToken)

        if (!deleted) {
          pendingLikeWrites.delete(postId)
          setLikeState(postId, current)
          return
        }

        pendingLikeWrites.delete(postId)
        void runLikeRpc('decrement_likes', postId, accessToken)
      }
    })()
  }

  return { isLiked: state.isLiked, likeCount: state.likeCount, toggleLike, authLoading }
}
