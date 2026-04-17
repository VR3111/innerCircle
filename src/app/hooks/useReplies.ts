import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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
  const { user } = useAuth()
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!postId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/replies`)
        url.searchParams.set('select', '*,profiles(username)')
        url.searchParams.set('post_id', `eq.${postId}`)
        url.searchParams.set('order', 'created_at.asc')

        const res = await fetch(url.toString(), {
          headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type':  'application/json',
          },
        })

        if (cancelled) return

        if (res.ok) {
          const data = await res.json() as any[]
          if (!cancelled) setReplies((data ?? []).map(mapRow))
        }
      } catch {
        // silently ignore — empty list is the fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [postId])

  const addReply = async (content: string): Promise<boolean> => {
    if (!user || !postId || !content.trim()) return false

    // Optimistic add
    const optimistic: Reply = {
      id:            `optimistic-${Date.now()}`,
      userId:        user.id,
      username:      user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'You',
      content:       content.trim(),
      isInnerCircle: false,
      isAgentReply:  false,
      timestamp:     'just now',
    }

    setReplies(prev => [...prev, optimistic])

    // Only check the INSERT result — don't chain .select().single() because a
    // missing profile row or join edge-case would make that fail with an error
    // even when the INSERT itself succeeded, causing addReply() to return false.
    const { error } = await supabase
      .from('replies')
      .insert({
        user_id:         user.id,
        post_id:         postId,
        content:         content.trim(),
        is_inner_circle: false,
      })

    if (error) {
      setReplies(prev => prev.filter(r => r.id !== optimistic.id))
      return false
    }

    // INSERT succeeded — leave the optimistic reply in place (it already shows
    // the correct username/content/timestamp).
    return true
  }

  const innerCircleReplies = replies.filter(r => r.isInnerCircle)
  const generalReplies     = replies.filter(r => !r.isInnerCircle)

  return { innerCircleReplies, generalReplies, loading, addReply }
}
