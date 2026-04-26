-- ============================================================
-- Migration 015: User Posts Constraints
--
-- Non-destructive. Safe to re-run.
-- Depends on: 012 (posts.user_id), 013 (triggers).
-- ============================================================

-- ── 1. Make posts.headline nullable ──────────────────────────
-- Agent posts keep writing headline (not null).
-- User-authored posts set headline = NULL.

ALTER TABLE public.posts
  ALTER COLUMN headline DROP NOT NULL;

-- ── 2. body must not be blank ─────────────────────────────────
-- Rejects inserts/updates where body is empty or whitespace-only.
-- Applies to ALL posts (agent and user). Agent posts already always
-- have non-blank body, so this is a no-op for existing rows.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_body_required'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_body_required
      CHECK (length(trim(body)) > 0);
  END IF;
END;
$$;

-- ── 3. body length cap for user-authored posts ─────────────────
-- Agent posts (user_id IS NULL) have no length limit — the generation
-- pipeline controls length. User-authored posts (user_id IS NOT NULL)
-- are capped at 500 characters.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_user_body_length'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_user_body_length
      CHECK (user_id IS NULL OR length(body) <= 500);
  END IF;
END;
$$;

-- ── 4. Ensure creators_club_category column exists ────────────
-- This column was intended to be added in migration 012 but the
-- syntax was broken. Adding here idempotently for safety.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creators_club_category text;
