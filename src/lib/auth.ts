import { supabase } from './supabase'

export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) throw error
  return data
}

/**
 * Sign in with either an email address or a username.
 * If the input contains "@" it is treated as an email directly.
 * Otherwise it is treated as a username and the corresponding email is
 * looked up via the get_email_by_username RPC function.
 */
export async function signIn(emailOrUsername: string, password: string) {
  let email = emailOrUsername.trim()

  if (!email.includes('@')) {
    const { data, error } = await supabase.rpc('get_email_by_username', {
      p_username: email,
    })
    if (error || !data) {
      throw new Error('No account found with that username')
    }
    email = data as string
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Supabase returns this when the account exists but the email address has
    // not yet been confirmed. Surface a clear message so the user knows what
    // to do rather than seeing a generic "Invalid login credentials" or a raw
    // 400 status code.
    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new Error('Please confirm your email address before signing in. Check your inbox for a confirmation link.')
    }
    throw error
  }
  return data
}

/**
 * Signs out from Supabase AND clears the local onboarding flag.
 * Callers are still responsible for navigating away after this resolves.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  // Clear local onboarding state regardless of whether the network call succeeded
  localStorage.removeItem('onboarded')
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
