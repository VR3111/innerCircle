-- ============================================================
-- Migration 009: Agent Replies Schema
--
-- Adds columns for threaded (parent/child) replies and pinning.
-- is_agent_reply already exists from 001_initial_schema.sql.
-- ============================================================

-- Pin agent replies to the top of a thread when appropriate
ALTER TABLE public.replies ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Thread replies: a reply can optionally be a direct response
-- to another reply (not just to the post).
ALTER TABLE public.replies ADD COLUMN IF NOT EXISTS parent_reply_id uuid
  REFERENCES public.replies(id) ON DELETE SET NULL;

-- ── Indexes ───────────────────────────────────────────────────

-- Fast lookup for all children of a given reply
CREATE INDEX IF NOT EXISTS idx_replies_parent_reply_id
  ON public.replies(parent_reply_id);

-- Fast fetch of agent replies for a given post
-- (used by the auto-reply endpoint to count existing agent replies)
CREATE INDEX IF NOT EXISTS idx_replies_post_agent
  ON public.replies(post_id, is_agent_reply);
