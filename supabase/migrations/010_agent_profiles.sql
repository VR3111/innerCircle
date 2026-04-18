-- ============================================================
-- Migration 010: Agent Profile Rows
--
-- Creates a public.profiles row for each of the 6 agents so
-- that agent replies can satisfy the FK:
--   replies.user_id → profiles.id
--
-- IMPORTANT: profiles.id has a FK constraint to auth.users(id).
-- Agent accounts are synthetic — they have no auth.users entry.
-- We bypass the FK constraint for these inserts using
-- session_replication_role = replica (superuser privilege).
--
-- Run this in the Supabase SQL Editor (postgres superuser role).
-- Do NOT run via a restricted service-role client.
-- ============================================================

-- ── Step 1: Bypass FK constraint (superuser only) ─────────────
SET session_replication_role = replica;

-- ── Step 2: Insert agent profile rows ────────────────────────
-- Only id and username are required (no DEFAULT on those columns).
-- rank defaults to 9999, following_count/circles_count to 0,
-- created_at to now(), avatar_url is nullable.

INSERT INTO public.profiles (id, username) VALUES
  ('00000000-0000-0000-0000-0000000a6a01', 'Baron'),
  ('00000000-0000-0000-0000-0000000b112a', 'Blitz'),
  ('00000000-0000-0000-0000-0000000c1234', 'Circuit'),
  ('00000000-0000-0000-0000-0000000ee512', 'Reel'),
  ('00000000-0000-0000-0000-0000000a771e', 'Pulse'),
  ('00000000-0000-0000-0000-0000000a7145', 'Atlas')
ON CONFLICT (id) DO NOTHING;

-- ── Step 3: Restore FK enforcement ───────────────────────────
SET session_replication_role = DEFAULT;
