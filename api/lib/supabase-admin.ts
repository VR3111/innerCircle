import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/database.types'

// Server-side only — uses the service role key which bypasses RLS.
// Never import this file in any browser code.
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl)       throw new Error('Missing VITE_SUPABASE_URL')
if (!serviceRoleKey)    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
