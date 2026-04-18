import { supabase } from './supabase'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const AUTH_STORAGE_KEY = 'inner-circle-auth'

const BASE_HEADERS = {
  apikey:          SUPABASE_ANON_KEY,
  'Content-Type':  'application/json',
}

export async function signUp(email: string, password: string, username: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ email, password, data: { username } }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.msg ?? data?.message ?? 'Sign-up failed')
  }
  return data
}

/**
 * Sign in with either an email address or a username.
 * If the input contains "@" it is treated as an email directly.
 * Otherwise it is treated as a username and the corresponding email is
 * looked up via the get_email_by_username RPC.
 *
 * After a successful sign-in the session is persisted to localStorage
 * under 'inner-circle-auth' so AuthContext's supabase.auth.getSession()
 * can pick it up without making any additional network calls.
 */
export async function signIn(emailOrUsername: string, password: string) {
  let email = emailOrUsername.trim()

  // ── 1. Resolve username → email if needed ──────────────────
  if (!email.includes('@')) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_email_by_username`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({ p_username: email }),
    })

    const resolved = await res.json()
    if (!res.ok || !resolved) {
      throw new Error('No account found with that username')
    }
    email = (resolved as string).replace(/^"|"$/g, '').trim()
  }

  // ── 2. Sign in with password ───────────────────────────────
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({ email, password }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    const msg: string = data?.error_description ?? data?.msg ?? data?.message ?? ''
    if (msg.toLowerCase().includes('email not confirmed')) {
      throw new Error(
        'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
      )
    }
    throw new Error(msg || 'Sign-in failed')
  }

  // ── 3. Persist session to localStorage ────────────────────
  const sessionData = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Math.floor(Date.now() / 1000) + (data.expires_in as number),
    expires_in:    data.expires_in,
    token_type:    data.token_type,
    user:          data.user,
  }
  const sessionJson = JSON.stringify(sessionData)
  localStorage.setItem(AUTH_STORAGE_KEY, sessionJson)

  // ── 4. Notify AuthContext about the new session ───────────
  // supabase.auth.setSession() hangs due to the PKCE deadlock, so we
  // dispatch a storage event instead. AuthContext's storage listener
  // picks this up and sets user + session in React state.
  window.dispatchEvent(
    new StorageEvent('storage', {
      key:      AUTH_STORAGE_KEY,
      newValue: sessionJson,
    })
  )

  return data
}

/**
 * Signs out from Supabase AND clears the local onboarding flag.
 * supabase.auth.signOut() is safe here because it only clears localStorage
 * synchronously without making any async PKCE-related calls.
 * Callers are still responsible for navigating away after this resolves.
 */
export async function signOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('onboarded')
}

/**
 * Returns the locally cached user without a network round-trip.
 * Reads from the same localStorage key that supabase-js writes to.
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as { user?: unknown }
    return session?.user ?? null
  } catch {
    return null
  }
}
