import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ensureProfile } from '../lib/profiles'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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
        setSession(prev => {
          const next = session ?? null
          return prev?.access_token === next?.access_token ? prev : next
        })
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
      setSession(prev => {
        const next = session ?? null
        return prev?.access_token === next?.access_token ? prev : next
      })
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
   * 1. Capture the access token before clearing state.
   * 2. Null out React state synchronously so any component that reads session
   *    sees null before the next render cycle.
   * 3. Clear localStorage keys and dispatch a StorageEvent so any other
   *    listeners (including other tabs) see the sign-out.
   * 4. Fire-and-forget: revoke the server-side token via raw fetch.
   *    No SDK calls — avoids the PKCE _useSession → _acquireLock deadlock path.
   */
  const doSignOut = async () => {
    const token = session?.access_token

    // 1. Wipe React state synchronously
    setSession(null)
    setUser(null)

    // 2. Clear localStorage
    localStorage.removeItem('onboarded')
    localStorage.removeItem('inner-circle-auth')

    // 3. Notify StorageEvent listeners (other tabs, AuthContext listener)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'inner-circle-auth',
        newValue: null,
        storageArea: localStorage,
      }),
    )

    // 4. Fire-and-forget: revoke server-side refresh token
    if (token) {
      void fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut: doSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
