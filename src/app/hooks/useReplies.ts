import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface Reply {
  id: string
  userId: string
  username: string
  content: string
  isInnerCircle: boolean
  isAgentReply: boolean
  timestamp: string
}

function timeAgo(isoString: string): string {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (secs < 60)    return 'just now'
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL     as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function mapRow(row: any): Reply {
  return {
    id:            row.id,
    userId:        row.user_id,
    username:      row.profiles?.username ?? 'Anonymous',
    content:       row.content,
    isInnerCircle: row.is_inner_circle,
    isAgentReply:  row.is_agent_reply,
    timestamp:     timeAgo(row.created_at),
  }
}

export function useReplies(postId: string | undefined) {
  const { user, session } = useAuth()
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const loadReplies = useCallback(async (targetPostId: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)

    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/replies`)
      url.searchParams.set('select', '*,profiles(username)')
      url.searchParams.set('post_id', `eq.${targetPostId}`)
      url.searchParams.set('order', 'created_at.asc')

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'apikey':        SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type':  'application/json',
        },
      })

      if (!res.ok) return

      const data = await res.json() as any[]
      setReplies((data ?? []).map(mapRow))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      // silently ignore other errors — empty list is the fallback
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!postId) {
      abortRef.current?.abort()
      setReplies([])
      setLoading(false)
      return
    }

    void loadReplies(postId)
  }, [postId, loadReplies])

  const addReply = async (content: string): Promise<boolean> => {
    const trimmed = content.trim()

    if (!user || !session?.access_token || !postId || !trimmed) return false

    const res = await fetch(`${SUPABASE_URL}/rest/v1/replies`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        user_id:         user.id,
        post_id:         postId,
        content:         trimmed,
        is_inner_circle: false,
      }),
    })

    if (!res.ok) {
      console.error('[addReply] POST failed', res.status, await res.text())
      return false
    }

    await loadReplies(postId)
    return true
  }

  const innerCircleReplies = replies.filter(r => r.isInnerCircle)
  const generalReplies     = replies.filter(r => !r.isInnerCircle)

  return { innerCircleReplies, generalReplies, loading, addReply }
}
