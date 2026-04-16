import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Diagnostic log — visible in browser console and Vercel function logs.
// Confirms whether env vars are being picked up at build time.
console.log('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'set' : 'MISSING')
console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'set' : 'MISSING')

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

// Guard: createClient throws if given an empty string URL (Supabase v2 parses
// it with `new URL()` internally). Fall back to a placeholder that prevents the
// module from crashing — all queries will fail gracefully with a network error
// rather than a ReferenceError that breaks every importing module.
const resolvedUrl  = supabaseUrl  || 'https://placeholder.supabase.co'
const resolvedKey  = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient<Database>(
  resolvedUrl,
  resolvedKey,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Explicitly bind to localStorage so the PKCE code verifier and session
      // token are written to the same store on every environment (avoids subtle
      // mismatches between in-memory and persisted storage in some bundlers).
      storage: localStorage,
      storageKey: 'inner-circle-auth',
    },
  }
)
