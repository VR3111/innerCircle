-- ============================================================
-- Migration 013: Profile Wire-Up Triggers (Half 2 — Triggers)
--
-- Apply ONLY after Half 1 (012) has been run successfully.
-- Kill-switch SQL to disable these triggers is documented in
-- /supabase/KILL_SWITCH.md.
--
-- Each trigger function is idempotent via CREATE OR REPLACE.
-- Each trigger is idempotent via DROP TRIGGER IF EXISTS before CREATE.
-- ============================================================

-- ── Trigger functions ─────────────────────────────────────────

-- Fires on INSERT to user_follows.
-- Increments followers_count for the followed user,
-- and user_following_count for the follower.
CREATE OR REPLACE FUNCTION public.trg_user_follow_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.adjust_user_followers(NEW.followed_id, 1);
  PERFORM public.adjust_user_following(NEW.follower_id, 1);
  RETURN NEW;
END;
$$;

-- Fires on DELETE from user_follows.
-- Decrements followers_count for the unfollowed user,
-- and user_following_count for the unfollower.
CREATE OR REPLACE FUNCTION public.trg_user_follow_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.adjust_user_followers(OLD.followed_id, -1);
  PERFORM public.adjust_user_following(OLD.follower_id, -1);
  RETURN OLD;
END;
$$;

-- Fires on INSERT to posts when user_id IS NOT NULL.
-- Agent posts (user_id IS NULL) are filtered by the trigger WHEN clause —
-- this function is never invoked for them.
CREATE OR REPLACE FUNCTION public.trg_user_post_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Belt-and-suspenders guard: trigger WHEN clause already filters this,
  -- but an explicit check prevents surprises if the trigger is altered.
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.adjust_user_posts_count(NEW.user_id, 1);
  END IF;
  RETURN NEW;
END;
$$;

-- Fires on DELETE from posts when user_id IS NOT NULL.
CREATE OR REPLACE FUNCTION public.trg_user_post_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    PERFORM public.adjust_user_posts_count(OLD.user_id, -1);
  END IF;
  RETURN OLD;
END;
$$;

-- Fires on INSERT to replies when is_agent_reply = false.
-- Agent replies from /api/agent-reply set is_agent_reply = true,
-- so they are filtered by the trigger WHEN clause.
-- Recomputes signal_score for the reply author.
CREATE OR REPLACE FUNCTION public.trg_user_reply_signal_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_agent_reply = false THEN
    PERFORM public.recompute_signal_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Fires on DELETE from replies when is_agent_reply = false.
CREATE OR REPLACE FUNCTION public.trg_user_reply_signal_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.is_agent_reply = false THEN
    PERFORM public.recompute_signal_score(OLD.user_id);
  END IF;
  RETURN OLD;
END;
$$;

-- ── Triggers ──────────────────────────────────────────────────
-- DROP IF EXISTS first for idempotency.

DROP TRIGGER IF EXISTS on_user_follow_insert       ON public.user_follows;
DROP TRIGGER IF EXISTS on_user_follow_delete       ON public.user_follows;
DROP TRIGGER IF EXISTS on_user_post_insert         ON public.posts;
DROP TRIGGER IF EXISTS on_user_post_delete         ON public.posts;
DROP TRIGGER IF EXISTS on_user_reply_signal_insert ON public.replies;
DROP TRIGGER IF EXISTS on_user_reply_signal_delete ON public.replies;

CREATE TRIGGER on_user_follow_insert
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_user_follow_insert();

CREATE TRIGGER on_user_follow_delete
  AFTER DELETE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_user_follow_delete();

-- WHEN clause prevents this trigger from firing on agent posts (user_id IS NULL).
CREATE TRIGGER on_user_post_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_user_post_insert();

CREATE TRIGGER on_user_post_delete
  AFTER DELETE ON public.posts
  FOR EACH ROW
  WHEN (OLD.user_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_user_post_delete();

-- WHEN clause prevents this trigger from firing on agent replies (is_agent_reply = true).
CREATE TRIGGER on_user_reply_signal_insert
  AFTER INSERT ON public.replies
  FOR EACH ROW
  WHEN (NEW.is_agent_reply = false)
  EXECUTE FUNCTION public.trg_user_reply_signal_insert();

CREATE TRIGGER on_user_reply_signal_delete
  AFTER DELETE ON public.replies
  FOR EACH ROW
  WHEN (OLD.is_agent_reply = false)
  EXECUTE FUNCTION public.trg_user_reply_signal_delete();
