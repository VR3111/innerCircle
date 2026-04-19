import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { detectAgentMention, type AgentName } from '../lib/agents'

export interface Reply {
  id: string
  userId: string
  username: string
  content: string
  isInnerCircle: boolean
  isAgentReply: boolean
  isPinned: boolean
  parentReplyId: string | null
  timestamp: string
}

// Tracks an in-flight agent trigger while the 300ms thinking delay
// or the actual API call is pending.
export interface PendingAgentReply {
  parentReplyId: string  // id of the user reply that triggered this
  agentName: AgentName
  status: 'thinking'
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
    isPinned:      row.is_pinned ?? false,
    parentReplyId: row.parent_reply_id ?? null,
    timestamp:     timeAgo(row.created_at),
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Cap-hit and error toasts ─────────────────────────────────────────────────

function handleCapHit(reason: string, agentName: AgentName) {
  const messages: Record<string, string> = {
    service_disabled: 'Agent replies are temporarily unavailable. Try again shortly.',
    daily_cost_limit: 'Agents are resting for today. Come back tomorrow.',
    user_daily_limit: "You've chatted enough with agents today. Come back tomorrow.",
    per_user:         `${capitalize(agentName)} has said their piece. Find them on another post.`,
  }
  toast(messages[reason] ?? 'Agent is unavailable right now.', {
    position: 'top-center',
    duration: 5000,
  })
}

function handleAgentError(msg: string) {
  toast.error(`Couldn't reach the agent: ${msg}`, {
    position: 'top-center',
    duration: 4000,
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReplies(postId: string | undefined) {
  const { user, session } = useAuth()
  const [replies, setReplies]                           = useState<Reply[]>([])
  const [loading, setLoading]                           = useState(true)
  const [pendingAgentReplies, setPendingAgentReplies]   = useState<Map<string, PendingAgentReply>>(new Map())
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

  // ─── Agent trigger ──────────────────────────────────────────────────────────
  // Fire-and-forget. Called from addReply after a successful user reply INSERT.
  // Shows the 300ms "thinking" indicator while waiting for the API response.

  async function triggerAgentReply(params: {
    postId:           string
    userReplyId:      string
    userReplyContent: string
    postHeadline:     string
    postBody:         string
    taggedAgent:      AgentName
    userId:           string
    accessToken:      string
  }) {
    const pendingKey = params.userReplyId

    // Show thinking indicator only after 300ms — fast cap-hit responses
    // will clear the timeout before it fires, avoiding a flash.
    const timeoutId = setTimeout(() => {
      setPendingAgentReplies(prev => {
        const next = new Map(prev)
        next.set(pendingKey, {
          parentReplyId: params.userReplyId,
          agentName:     params.taggedAgent,
          status:        'thinking',
        })
        return next
      })
    }, 800)

    try {
      const res = await fetch('/api/agent-reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.accessToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          postId:           params.postId,
          userReplyId:      params.userReplyId,
          userReplyContent: params.userReplyContent,
          postHeadline:     params.postHeadline,
          postBody:         params.postBody,
          taggedAgent:      params.taggedAgent,
          userId:           params.userId,
        }),
      })

      clearTimeout(timeoutId)

      const data = await res.json() as any

      if (data.isCapHit) {
        if (data.capHitReason === 'per_post') {
          // A pinned reply was written to DB — refresh so it appears in thread.
          // No toast: the reply itself is the visible signal.
          await loadReplies(params.postId)
        } else {
          handleCapHit(data.capHitReason ?? '', params.taggedAgent)
        }
      } else if (!res.ok || data.error) {
        handleAgentError(data.error ?? 'Unknown error')
      } else if (data.success) {
        // Normal reply written to DB — refresh to show it.
        await loadReplies(params.postId)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('[triggerAgentReply] error:', err)
      handleAgentError('Network error')
    } finally {
      // Always clear the thinking indicator regardless of outcome.
      setPendingAgentReplies(prev => {
        const next = new Map(prev)
        next.delete(pendingKey)
        return next
      })
    }
  }

  // ─── addReply ───────────────────────────────────────────────────────────────
  // postHeadline and postBody are needed to call /api/agent-reply. Pass them
  // from PostDetail (which has the post data) whenever an @agent mention is
  // possible. Safe to omit for non-post contexts — agent trigger is skipped
  // when they are absent.

  const addReply = async (
    content:       string,
    isInnerCircle  = false,
    parentReplyId?: string,
    postHeadline?:  string,
    postBody?:      string,
  ): Promise<boolean> => {
    const trimmed = content.trim()
    if (!user || !session?.access_token || !postId || !trimmed) return false

    const body: Record<string, unknown> = {
      user_id:         user.id,
      post_id:         postId,
      content:         trimmed,
      is_inner_circle: isInnerCircle,
    }
    if (parentReplyId) {
      body.parent_reply_id = parentReplyId
    }

    // Use return=representation to get the inserted row's id back.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/replies`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('[addReply] POST failed', res.status, await res.text())
      return false
    }

    const rows        = await res.json() as any[]
    const insertedRow = rows?.[0]

    // Refresh immediately so the user's own reply appears.
    await loadReplies(postId)

    // Agent trigger — only when we have the inserted id and post context.
    const taggedAgent = detectAgentMention(trimmed)
    if (taggedAgent && insertedRow?.id && postHeadline && postBody) {
      void triggerAgentReply({
        postId,
        userReplyId:      insertedRow.id,
        userReplyContent: trimmed,
        postHeadline,
        postBody,
        taggedAgent,
        userId:      user.id,
        accessToken: session.access_token,
      })
    }

    return true
  }

  const innerCircleReplies = replies.filter(r =>  r.isInnerCircle)
  const generalReplies     = replies.filter(r => !r.isInnerCircle)

  return { innerCircleReplies, generalReplies, loading, addReply, pendingAgentReplies }
}
