-- ============================================================
-- Migration 012: Profile Wire-Up Schema (Half 1 — Zero-Risk Additions)
--
-- This is Half 1 of the Step-1 profile wire-up.
-- No triggers in this file — those come in 013.
-- Migration is non-destructive: ALTER ADD COLUMN IF NOT EXISTS,
-- CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION.
-- Safe to re-run.
-- ============================================================

-- ── 1. New columns on profiles ────────────────────────────────
-- All nullable or with defaults — non-destructive.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name         text,
  ADD COLUMN IF NOT EXISTS bio                  text,
  ADD COLUMN IF NOT EXISTS is_inner_circle      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signal_score         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_following_count integer NOT NULL DEFAULT 0;
  ADD COLUMN IF NOT EXISTS creators_club_category text;
-- ── 2. user_id column on posts ────────────────────────────────
-- NULL = agent-authored (from /api/generate-posts cron).
-- NOT NULL = user-authored (from future Compose feature).

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_posts_user_id
  ON public.posts(user_id)
  WHERE user_id IS NOT NULL;

-- ── 3. user_follows table ─────────────────────────────────────
-- Separate from the existing follows table (user→agent).
-- This table is for user→user follows.

CREATE TABLE IF NOT EXISTS public.user_follows (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON public.user_follows(followed_id);

-- ── 4. RLS on user_follows ────────────────────────────────────

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_follows_select_all"  ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_insert_own"  ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_delete_own"  ON public.user_follows;

-- Public follow graph for v1 — anyone can see who follows whom.
CREATE POLICY "user_follows_select_all"
  ON public.user_follows FOR SELECT
  USING (true);

-- Users can only insert follows where they are the follower.
CREATE POLICY "user_follows_insert_own"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follow rows.
CREATE POLICY "user_follows_delete_own"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ── 5. Additional RLS on posts ────────────────────────────────
-- posts_select_all already exists from 001_initial_schema.sql.
-- Agent posts from /api/generate-posts use the service role key,
-- which bypasses RLS — these policies only restrict user-authored writes.

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

CREATE POLICY "posts_insert_own"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "posts_delete_own"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- ── 6. RPCs ───────────────────────────────────────────────────
-- All SECURITY DEFINER with explicit search_path for safety.

-- Recomputes signal_score from current counter columns + live reply count.
-- Formula: followers_count + ROUND((posts_count + reply_count) * 0.10)
-- Called by adjust_user_followers and adjust_user_posts_count after each change.
CREATE OR REPLACE FUNCTION public.recompute_signal_score(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_followers integer;
  v_posts     integer;
  v_replies   integer;
  v_score     integer;
BEGIN
  SELECT followers_count, posts_count
    INTO v_followers, v_posts
    FROM public.profiles
   WHERE id = p_user_id;

  SELECT count(*)
    INTO v_replies
    FROM public.replies
   WHERE user_id = p_user_id
     AND is_agent_reply = false;

  v_score := v_followers + ROUND((v_posts + v_replies) * 0.10);

  UPDATE public.profiles
     SET signal_score = v_score
   WHERE id = p_user_id;
END;
$$;

-- Adjusts followers_count for a user (called when someone follows/unfollows them).
-- p_delta = +1 on follow, -1 on unfollow.
-- Also triggers a signal_score recompute (followers affect signal).
CREATE OR REPLACE FUNCTION public.adjust_user_followers(p_followed_id uuid, p_delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
     SET followers_count = GREATEST(0, followers_count + p_delta)
   WHERE id = p_followed_id;

  PERFORM public.recompute_signal_score(p_followed_id);
END;
$$;

-- Adjusts user_following_count for a user (called when they follow/unfollow someone).
-- p_delta = +1 on follow, -1 on unfollow.
-- NOTE: who you follow does NOT affect signal_score — no recompute here.
CREATE OR REPLACE FUNCTION public.adjust_user_following(p_follower_id uuid, p_delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
     SET user_following_count = GREATEST(0, user_following_count + p_delta)
   WHERE id = p_follower_id;
END;
$$;

-- Adjusts posts_count for a user (called when they create/delete a user-authored post).
-- p_delta = +1 on insert, -1 on delete.
-- Also triggers a signal_score recompute (post count affects signal).
CREATE OR REPLACE FUNCTION public.adjust_user_posts_count(p_user_id uuid, p_delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
     SET posts_count = GREATEST(0, posts_count + p_delta)
   WHERE id = p_user_id;

  PERFORM public.recompute_signal_score(p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_signal_score(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_user_followers(uuid, int)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_user_following(uuid, int)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_user_posts_count(uuid, int) TO authenticated;

-- ── 7. Backfill existing data ─────────────────────────────────
-- IMPORTANT: Agent profile rows (created in migration 010) have phantom FK
-- references to auth.users. UPDATE on these rows will trigger FK re-check
-- and abort. We use session_replication_role = replica to bypass FK
-- enforcement during backfill, matching the precedent set in migration 010.
--
-- This bypass applies ONLY to the current session. After the migration
-- completes, FK enforcement returns to normal for all future operations.

SET session_replication_role = replica;

-- Backfill agent profile display_name and bio from the agents table.
-- agents.id is lowercase ('baron', 'blitz', etc.).
-- profiles.username for agent rows is capitalized ('Baron', 'Blitz', etc.)
-- per migration 010.
-- Match using lower() and only fill rows where display_name IS NULL.
UPDATE public.profiles SET
  display_name = a.name,
  bio          = a.tagline
FROM public.agents a
WHERE lower(profiles.username) = a.id
  AND profiles.display_name IS NULL;

-- Backfill posts_count for all profiles.
-- user_id was just added and is NULL for all existing posts (agent posts),
-- so this will correctly set posts_count = 0 for all 22 profiles.
UPDATE public.profiles p SET
  posts_count = (
    SELECT count(*) FROM public.posts WHERE user_id = p.id
  );

-- followers_count and user_following_count remain 0 — user_follows is empty.

-- Backfill signal_score for all 22 profile rows.
-- recompute_signal_score does an UPDATE on profiles, which would trigger
-- the FK re-check on agent rows without the replica bypass above.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_signal_score(r.id);
  END LOOP;
END;
$$;

-- Restore normal FK enforcement.
SET session_replication_role = origin;
