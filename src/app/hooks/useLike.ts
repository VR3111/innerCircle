import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useLike(postId: string | undefined, initialLikeCount: number) {
  const { user, loading: authLoading } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(
    Number.isFinite(initialLikeCount) ? initialLikeCount : 0
  )

  // Sync likeCount when the initial value changes (e.g. post finishes loading).
  // Guard against NaN/Infinity in case the PostgREST embedded count shape
  // produces an unexpected value before the mapping normalises it.
  useEffect(() => {
    setLikeCount(Number.isFinite(initialLikeCount) ? initialLikeCount : 0)
  }, [initialLikeCount])

  // Check whether the current user has already liked this post.
  // Depends on user?.id rather than user to avoid re-running on every
  // Supabase token refresh, which produces a new user object each time.
  useEffect(() => {
    if (!user || !postId || authLoading) {
      setIsLiked(false)
      return
    }

    supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()
      .then(({ data }) => {
        setIsLiked(!!data)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id, authLoading])

  const toggleLike = async () => {
    if (!user || !postId) return

    const wasLiked = isLiked

    // Optimistic update
    setIsLiked(!wasLiked)
    setLikeCount(c => c + (wasLiked ? -1 : 1))

    if (!wasLiked) {
      // Update the counter first via RPC (security definer — runs as postgres,
      // no auth.uid() dependency in the RLS path).
      await supabase.rpc('increment_likes', { post_id: postId })

      // Then persist the like row directly from the frontend so the user's
      // auth token is attached to the request and RLS can verify user_id.
      const { error } = await supabase
        .from('post_likes')
        .insert({ user_id: user.id, post_id: postId })

      if (error) {
        // Row insert failed — undo the optimistic update and the counter.
        setIsLiked(wasLiked)
        setLikeCount(c => c - 1)
        await supabase.rpc('decrement_likes', { post_id: postId })
      }
    } else {
      // Delete the like row first; the user's auth token is attached so RLS
      // can verify ownership before we touch the counter.
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) {
        setIsLiked(wasLiked)
        setLikeCount(c => c + 1)
        return
      }

      await supabase.rpc('decrement_likes', { post_id: postId })
    }
  }

  return { isLiked, likeCount, toggleLike }
}
