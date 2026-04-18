import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/database.types'

// Server-side only — uses the service role key which bypasses RLS.
// Never import this file in any browser code.
//
// Env vars are validated lazily at request time (not module load time) so that
// a missing variable produces a clear error message rather than a cold-start
// module failure that shows up as FUNCTION_INVOCATION_FAILED with no context.

let _client: SupabaseClient<Database> | null = null

export function getSupabaseAdmin() {
  if (_client) return _client

  const supabaseUrl    = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl)    throw new Error('Missing env var: VITE_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')

  _client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
  return _client
}
