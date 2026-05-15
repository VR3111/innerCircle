// ── Daily spend helpers ──────────────────────────────────────
//
// Shared by both pipelines (agent replies + post generation).
// Reads from / writes to the daily_spend table via the
// increment_daily_spend Postgres RPC (migration 011).

import { getSupabaseAdmin } from './supabase-admin'

// Returns today's estimated spend in cents (UTC day boundary).
export async function getTodaySpendCents(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]  // 'YYYY-MM-DD' UTC
  const { data } = await getSupabaseAdmin()
    .from('daily_spend')
    .select('estimated_cost_cents')
    .eq('date', today)
    .maybeSingle()
  return data?.estimated_cost_cents ?? 0
}

// Atomically increments both reply count and cost for today.
// Uses the increment_daily_spend Postgres function (migration 011)
// to avoid a read-modify-write race under concurrent requests.
export async function incrementTodaySpendCents(cents: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  await getSupabaseAdmin().rpc('increment_daily_spend', {
    p_date:  today,
    p_cents: cents,
  })
}
