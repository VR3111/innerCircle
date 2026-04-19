import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { ensureProfile } from '../../lib/profiles'

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
    const ensureProfileIfNeeded = async (session: Session | null) => {
      if (!session?.user) return

      try {
        await ensureProfile(session.user)
      } catch (err) {
        console.warn('[Inner Circle] ensureProfile failed:', err)
      }
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        // Functional update: return the previous object if the id is unchanged,
        // preventing a subtree re-render when the value is semantically the same.
        setUser(prev => {
          const next = session?.user ?? null
          return prev?.id === next?.id ? prev : next
        })
        void ensureProfileIfNeeded(session)
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
      setUser(prev => {
        const next = session?.user ?? null
        return prev?.id === next?.id ? prev : next
      })
      setLoading(false)

      // Auto-create or backfill the profile row whenever we get a usable session.
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureProfileIfNeeded(session)
      }
    })

    // Listen for the manual storage event dispatched by auth.ts signIn().
    // supabase.auth.setSession() hangs due to the PKCE deadlock, so signIn()
    // writes the session to localStorage then fires this event so we can
    // update React state without going through the supabase client.
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'inner-circle-auth') return
      if (!e.newValue) {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const parsed = JSON.parse(e.newValue)
        if (parsed?.access_token) {
          setSession(parsed as Session)
          setUser(prev => {
            const next = (parsed.user as User) ?? null
            return prev?.id === next?.id ? prev : next
          })
          setLoading(false)
          void ensureProfileIfNeeded(parsed as Session)
        }
      } catch {}
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
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
