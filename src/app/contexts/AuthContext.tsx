import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  /** Clears local auth state synchronously, then calls supabase.auth.signOut(). */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
      })
      .catch((err) => {
        console.warn('[Inner Circle] getSession failed:', err)
      })
      .finally(() => {
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Auto-create profile row on first sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!existing) {
            const username =
              session.user.user_metadata?.username ||
              session.user.email?.split('@')[0] ||
              'user'
            // Silently fails if INSERT policy is not yet applied — see migration 002
            await supabase.from('profiles').insert({ id: session.user.id, username })
          }
        } catch (_err) {
          // Silently ignore — profile row creation is best-effort
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Sign out with no race condition.
   *
   * The bug with calling supabase.auth.signOut() and then immediately calling
   * navigate("/auth") is that onAuthStateChange fires asynchronously AFTER the
   * network round-trip. If navigate fires first, Auth.tsx mounts while session
   * is still truthy → its useEffect redirects the user back to /home.
   *
   * Fix: null out session/user in React state RIGHT NOW (synchronous), THEN do
   * the network call. By the time navigate("/auth") fires and Auth.tsx mounts,
   * the context already has session = null so Auth.tsx won't redirect anywhere.
   */
  const doSignOut = async () => {
    // 1. Wipe local React state synchronously so any mounted component that
    //    reads session sees null before the next render cycle.
    setSession(null)
    setUser(null)

    // 2. Clear the onboarding flag so a future sign-up goes through onboarding.
    localStorage.removeItem('onboarded')

    // 3. Tell Supabase to invalidate the server-side token.
    try {
      await supabase.auth.signOut()
    } catch (_err) {
      // Network failure or already-expired token. Local state is already
      // cleared so the user is effectively signed out on this client.
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut: doSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
