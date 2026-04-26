import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface CreatePostParams {
  body:      string
  agent_id:  string
  image?:    Blob | null
}

interface CreatePostResult {
  post?: { id: string }
  error?: string
}

/**
 * Resize an image to a max dimension of 1920px and return as JPEG blob.
 */
async function resizeImage(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const MAX = 1920
  let { width, height } = bitmap
  if (width > MAX || height > MAX) {
    const scale = MAX / Math.max(width, height)
    width  = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
}

export function useCreatePost() {
  const { session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createPost = async (params: CreatePostParams): Promise<CreatePostResult> => {
    if (!session?.access_token || !session.user) {
      return { error: 'Not authenticated' }
    }

    setIsSubmitting(true)
    const postId = crypto.randomUUID()
    const userId = session.user.id
    const token  = session.access_token
    let imageUrl: string | null = null

    try {
      // 1. Upload image if provided
      if (params.image) {
        const resized = await resizeImage(params.image)
        const path = `${userId}/${postId}.jpg`

        const uploadRes = await fetch(
          `${SUPABASE_URL}/storage/v1/object/post-images/${path}`,
          {
            method: 'POST',
            headers: {
              apikey:        SUPABASE_ANON_KEY,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'image/jpeg',
            },
            body: resized,
          },
        )

        if (!uploadRes.ok) {
          const errBody = await uploadRes.json().catch(() => ({}))
          return { error: `Image upload failed: ${(errBody as { message?: string }).message ?? uploadRes.statusText}` }
        }

        imageUrl = `${SUPABASE_URL}/storage/v1/object/public/post-images/${path}`
      }

      // 2. Insert post row via REST API
      const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          apikey:         SUPABASE_ANON_KEY,
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer:         'return=representation',
        },
        body: JSON.stringify({
          id:        postId,
          user_id:   userId,
          agent_id:  params.agent_id,
          headline:  params.body.slice(0, 120),
          body:      params.body,
          image_url: imageUrl,
          likes:     0,
          comments:  0,
          shares:    0,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = (errData as { message?: string }).message ?? `Post failed (${res.status})`

        // Clean up orphaned image
        if (imageUrl) {
          void fetch(`${SUPABASE_URL}/storage/v1/object/post-images`, {
            method: 'DELETE',
            headers: {
              apikey:         SUPABASE_ANON_KEY,
              Authorization:  `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefixes: [`${userId}/${postId}.jpg`] }),
          })
        }

        return { error: msg }
      }

      return { post: { id: postId } }
    } catch (err) {
      // Clean up orphaned image on network error
      if (imageUrl) {
        void fetch(`${SUPABASE_URL}/storage/v1/object/post-images`, {
          method: 'DELETE',
          headers: {
            apikey:         SUPABASE_ANON_KEY,
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefixes: [`${userId}/${postId}.jpg`] }),
        })
      }
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { createPost, isSubmitting }
}
