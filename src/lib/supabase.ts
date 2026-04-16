import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Production readiness check — missing vars mean no Supabase connection
if (!supabaseUrl) {
  console.warn(
    '[Inner Circle] Missing VITE_SUPABASE_URL. ' +
    'Add it to .env (local) or Vercel → Settings → Environment Variables.'
  )
}
if (!supabaseAnonKey) {
  console.warn(
    '[Inner Circle] Missing VITE_SUPABASE_ANON_KEY. ' +
    'Add it to .env (local) or Vercel → Settings → Environment Variables.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: 'inner-circle-auth',
    },
  }
)
