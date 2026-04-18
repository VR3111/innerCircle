import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ─── Cache + inflight dedupe ──────────────────────────────────────────────────
//
// likeCache: settled isLiked per "userId:postId", with a TTL.
//   - Short TTL (10s) prevents re-storms when rapid auth state changes cause
//     the effect to fire multiple times in quick succession.
//   - TTL expiry ensures PostDetail (or any remount after ~10s) fetches fresh
//     data rather than serving permanently stale state.
//   - Toggling a like writes a fresh-timestamped entry, so the optimistic
//     state is served to any concurrent component for the next 10s.
//
// likeInflight: in-flight Promise per key, cleared on settle.
//   - Any effect invocation that fires while a fetch is running for the same
//     key joins the existing promise instead of starting a new request.
//   - This is the primary storm guard: N rapid effect re-runs → 1 request.

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

// ─── Fetch helpers ────────────────────────────────────────────────────────────

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

// Returns a Promise<boolean> with three behaviours (in priority order):
//   1. Fresh cache hit  → resolved promise, no network call
//   2. Inflight request → existing promise shared with the first caller
//   3. Cache miss       → new fetch, registered in inflight until settled
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
    body:   JSON.stringify({ post_id: postId }),
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLike(postId: string | undefined, initialLikeCount: number) {
  const { user, session, loading: authLoading } = useAuth()

  // Seed isLiked from cache if a fresh entry exists. This gives the correct
  // state immediately on mount without waiting for the async effect/fetch.
  // Falls back to false on cache miss or when postId/user is not yet defined.
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    if (!postId || !user?.id) return false
    return readCache(cacheKey(user.id, postId)) ?? false
  })

  // Track the like count as a delta from initialLikeCount rather than as
  // absolute state. This is critical for PostDetail:
  //
  //   PostDetail calls useLike(postWithAgent?.post.id, postWithAgent?.post.reactions ?? 0)
  //   On first render postWithAgent is undefined, so initialLikeCount = 0.
  //   useState(0) would lock likeCount to 0 forever — React ignores subsequent
  //   initial-value arguments after the first render.
  //
  //   With the delta approach, likeCount = initialLikeCount + likeCountDelta.
  //   When usePost resolves and initialLikeCount becomes post.reactions (e.g. 1),
  //   the displayed count immediately reflects that without any extra effect.
  const [likeCountDelta, setLikeCountDelta] = useState(0)
  const likeCount = initialLikeCount + likeCountDelta

  useEffect(() => {
    if (!postId || !user || !session?.access_token) {
      setIsLiked(false)
      return
    }

    const token = session.access_token
    let cancelled = false

    // fetchIsLikedDeduped handles cache-hit / inflight-join / new-fetch
    // internally, so no duplicate guard is needed here.
    fetchIsLikedDeduped(postId, user.id, token).then(liked => {
      if (!cancelled) setIsLiked(liked)
    })

    return () => { cancelled = true }
  // session.access_token intentionally excluded: user?.id covers auth changes,
  // and token refreshes must not re-fetch from all mounted PostCards at once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id])

  const toggleLike = () => {
    if (!user || !postId || !session?.access_token) return

    const key            = cacheKey(user.id, postId)
    const token          = session.access_token
    const wasLiked       = isLiked
    const deltaIncrement = wasLiked ? -1 : 1

    // Optimistic update. Write to cache with a fresh timestamp so concurrent
    // effect re-runs (e.g. from auth state changes) get the new value and
    // skip the network call.
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
          // Already liked in DB — optimistic state is correct.
          return
        }

        // Insert failed — roll back cache and state.
        writeCache(key, wasLiked)
        setIsLiked(wasLiked)
        setLikeCountDelta(d => d - deltaIncrement)
      } else {
        const deleted = await deleteLike(postId, user.id, token)

        if (!deleted) {
          // Roll back.
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
