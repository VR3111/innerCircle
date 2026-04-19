-- ============================================================
-- Migration 011: Daily Spend Tracking
--
-- Adds a daily_spend table to track agent reply costs per UTC day,
-- and a Postgres function for atomic upsert-increment. Used by the
-- cost-safety mechanisms in api/agent-reply.ts.
--
-- Also adds an index on replies(user_id, created_at) filtered to
-- non-agent rows to speed up the per-user rolling-24h cap query.
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_spend (
  date                  DATE        PRIMARY KEY,
  agent_reply_count     INTEGER     NOT NULL DEFAULT 0,
  estimated_cost_cents  INTEGER     NOT NULL DEFAULT 0,  -- stored as cents to avoid float math; 1 reply ≈ 2 cents
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Atomic increment RPC ──────────────────────────────────────
-- Called from api/agent-reply.ts after every successful reply insert.
-- Uses ON CONFLICT to handle the first call of each UTC day.

CREATE OR REPLACE FUNCTION increment_daily_spend(p_date DATE, p_cents INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_spend (date, agent_reply_count, estimated_cost_cents)
  VALUES (p_date, 1, p_cents)
  ON CONFLICT (date) DO UPDATE SET
    agent_reply_count    = daily_spend.agent_reply_count    + 1,
    estimated_cost_cents = daily_spend.estimated_cost_cents + p_cents,
    updated_at           = NOW();
END;
$$ LANGUAGE plpgsql;

-- ── Index on replies for per-user 24h cap query ───────────────
-- Speeds up the two-step lookup in countUserAgentRepliesLast24h:
-- Step 1 filters replies by (user_id, created_at) where is_agent_reply = false.

CREATE INDEX IF NOT EXISTS idx_replies_agent_user_time
  ON replies (user_id, created_at)
  WHERE is_agent_reply = false;
