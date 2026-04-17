import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useLike(postId: string, initialLikeCount: number) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)

  // Check whether the current user has already liked this post.
  // Depends on user?.id rather than user to avoid re-running on every
  // Supabase token refresh, which produces a new user object each time.
  useEffect(() => {
    if (!user) {
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
  }, [postId, user?.id])

  const toggleLike = async () => {
    if (!user) return

    const wasLiked = isLiked

    // Optimistic update
    setIsLiked(!wasLiked)
    setLikeCount(c => c + (wasLiked ? -1 : 1))

    if (!wasLiked) {
      const { error } = await supabase
        .from('post_likes')
        .insert({ user_id: user.id, post_id: postId })

      if (error) {
        setIsLiked(wasLiked)
        setLikeCount(c => c - 1)
        return
      }

      await supabase.rpc('increment_likes', { p_post_id: postId })
    } else {
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

      await supabase.rpc('decrement_likes', { p_post_id: postId })
    }
  }

  return { isLiked, likeCount, toggleLike }
}
