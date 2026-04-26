import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const CACHE_TTL_MS = 10_000

interface CacheEntry { value: boolean; ts: number }
const likeCache    = new Map<string, CacheEntry>()
const likeInflight = new Map<string, Promise<boolean>>()

function cacheKey(userId: string, postId: string) {
  return `${userId}:${postId}`
}

function readCache(key: string): boolean | undefined {
  const entry = likeCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    likeCache.delete(key)
    return undefined
  }
  return entry.value
}

function writeCache(key: string, value: boolean) {
  likeCache.set(key, { value, ts: Date.now() })
}

async function authedFetch(path: string, accessToken: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey:         SUPABASE_ANON_KEY,
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

async function fetchIsLiked(postId: string, userId: string, accessToken: string): Promise<boolean> {
  const params = new URLSearchParams({
    select:  'id',
    user_id: `eq.${userId}`,
    post_id: `eq.${postId}`,
    limit:   '1',
  })
  const res = await authedFetch(`post_likes?${params.toString()}`, accessToken)
  if (!res.ok) return false
  const data = await res.json() as Array<{ id: string }>
  return data.length > 0
}

function fetchIsLikedDeduped(
  postId: string,
  userId: string,
  accessToken: string
): Promise<boolean> {
  const key = cacheKey(userId, postId)

  const cached = readCache(key)
  if (cached !== undefined) {
    return Promise.resolve(cached)
  }

  if (likeInflight.has(key)) {
    return likeInflight.get(key)!
  }

  const promise = fetchIsLiked(postId, userId, accessToken)
    .then(liked => {
      writeCache(key, liked)
      likeInflight.delete(key)
      return liked
    })
    .catch(err => {
      likeInflight.delete(key)
      throw err
    })

  likeInflight.set(key, promise)
  return promise
}

async function insertLike(postId: string, userId: string, accessToken: string) {
  return authedFetch('post_likes', accessToken, {
    method: 'POST',
    body:   JSON.stringify({ user_id: userId, post_id: postId }),
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

async function runLikeRpc(
  name: 'increment_likes' | 'decrement_likes',
  postId: string,
  accessToken: string
) {
  await authedFetch(`rpc/${name}`, accessToken, {
    method: 'POST',
    body:   JSON.stringify({ p_post_id: postId }),
  })
}

export function useLike(postId: string | undefined, initialLikeCount: number) {
  const { user, session, loading: authLoading } = useAuth()

  const [isLiked, setIsLiked] = useState<boolean>(() => {
    if (!postId || !user?.id) return false
    return readCache(cacheKey(user.id, postId)) ?? false
  })

  const [likeCountDelta, setLikeCountDelta] = useState(0)
  const likeCount = initialLikeCount + likeCountDelta

  useEffect(() => {
    if (!postId || !user || !session?.access_token) {
      setIsLiked(false)
      return
    }

    const token = session.access_token
    let cancelled = false

    fetchIsLikedDeduped(postId, user.id, token).then(liked => {
      if (!cancelled) setIsLiked(liked)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id, session?.access_token])

  const toggleLike = () => {
    if (!user || !postId || !session?.access_token) return

    const key            = cacheKey(user.id, postId)
    const token          = session.access_token
    const wasLiked       = isLiked
    const deltaIncrement = wasLiked ? -1 : 1

    writeCache(key, !wasLiked)
    setIsLiked(!wasLiked)
    setLikeCountDelta(d => d + deltaIncrement)

    void (async () => {
      if (!wasLiked) {
        const res = await insertLike(postId, user.id, token)

        if (res.ok) {
          void runLikeRpc('increment_likes', postId, token)
          return
        }

        if (res.status === 409) {
          return
        }

        writeCache(key, wasLiked)
        setIsLiked(wasLiked)
        setLikeCountDelta(d => d - deltaIncrement)
      } else {
        const deleted = await deleteLike(postId, user.id, token)

        if (!deleted) {
          writeCache(key, wasLiked)
          setIsLiked(wasLiked)
          setLikeCountDelta(d => d - deltaIncrement)
          return
        }

        void runLikeRpc('decrement_likes', postId, token)
      }
    })()
  }

  return { isLiked, likeCount, toggleLike, authLoading }
}
