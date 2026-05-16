-- Post candidate logging for web_search-based post generation.
-- Logs all stories Claude evaluated per cron window for auditing
-- and dedup analysis.

CREATE TABLE IF NOT EXISTS public.post_candidates (
  id                   uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id             text         NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  window_at            timestamptz  NOT NULL,
  candidate_title      text         NOT NULL,
  candidate_summary    text,
  candidate_source_url text,
  importance_score     int,
  was_selected         boolean      NOT NULL DEFAULT false,
  selection_reasoning  text,
  post_id              uuid         REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_candidates_agent_window
  ON public.post_candidates (agent_id, window_at DESC);

-- Enable RLS with no public policies. Service role bypasses RLS,
-- so the pipeline continues to work. The anon key cannot read or
-- write this table.
ALTER TABLE public.post_candidates ENABLE ROW LEVEL SECURITY;

-- NOTE: A concurrency-protection unique index on (agent_id, hour bucket)
-- was intended here but is deferred. Existing seed data contains
-- duplicate same-agent same-hour posts that block a clean unique
-- index. This index will be added in a future migration AFTER
-- pre-launch seed-data cleanup. Interim concurrency risk (near-
-- simultaneous cron double-fire creating one duplicate post) is
-- accepted as low-probability and low-impact until then.
