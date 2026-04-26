import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { FollowProvider } from './hooks/useFollow'
import { MobileLayout } from './layouts/MobileLayout'
import { DesktopLayout } from './layouts/DesktopLayout'
import { useIsDesktop } from './lib/useIsDesktop'
import { SplashScreen } from './screens/SplashScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { PostDetailScreen } from './screens/PostDetailScreen'
import { ArenasHubScreen } from './screens/ArenasHubScreen'
import { CategoryLeaderboardScreen } from './screens/CategoryLeaderboardScreen'
import { ExploreScreen } from './screens/ExploreScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { AuthScreen } from './screens/AuthScreen'
import { ResetPasswordScreen } from './screens/ResetPasswordScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { UserProfileScreen } from './screens/UserProfileScreen'
import { ComposeScreen } from './screens/ComposeScreen'
import { DMListScreen } from './screens/DMListScreen'
import { DMThreadScreen } from './screens/DMThreadScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { PaywallScreen } from './screens/PaywallScreen'

// ── RequireAuth ─────────────────────────────────────────────
// Redirects to /auth when there is no session; shows nothing while loading.
// When the destination is "/" (splash/onboarding), returning users go to /home.
function RequireAuth() {
  const { session, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!session) return <Navigate to="/auth" replace />

  if (location.pathname === '/') {
    const onboarded = localStorage.getItem('onboarded')
    if (onboarded === 'true') {
      return <Navigate to="/home" replace />
    }
    if (onboarded !== 'false') {
      const createdAt = user?.created_at ? new Date(user.created_at).getTime() : 0
      const isReturningUser = Date.now() - createdAt > 60_000
      if (isReturningUser) return <Navigate to="/home" replace />
    }
  }

  return <Outlet />
}

// ── Shell (responsive layout) ───────────────────────────────
function Shell() {
  const desktop = useIsDesktop()
  return desktop
    ? <DesktopLayout><Outlet /></DesktopLayout>
    : <MobileLayout><Outlet /></MobileLayout>
}

// ── Router ──────────────────────────────────────────────────
const router = createBrowserRouter([
  // Public routes — no session required
  { path: '/auth',           Component: AuthScreen },
  { path: '/reset-password', Component: ResetPasswordScreen },

  // Everything else requires a session
  {
    Component: RequireAuth,
    children: [
      // Splash / onboarding — no shell
      { path: '/', Component: SplashScreen },
      { path: '/onboarding', Component: OnboardingScreen },

      // Main app — inside responsive shell
      {
        Component: Shell,
        children: [
          { path: '/home',                  Component: HomeScreen },
          { path: '/leaderboard',           Component: ArenasHubScreen },
          { path: '/leaderboard/:category', Component: CategoryLeaderboardScreen },
          { path: '/explore',               Component: ExploreScreen },
          { path: '/profile',               Component: ProfileScreen },
          { path: '/profile/:handle',       Component: UserProfileScreen },
          { path: '/post/:id',              Component: PostDetailScreen },
          { path: '/notifications',         Component: NotificationsScreen },
          { path: '/settings',              Component: SettingsScreen },
          { path: '/compose',               Component: ComposeScreen },
          { path: '/dms',                   Component: DMListScreen },
          { path: '/dm/:threadId',          Component: DMThreadScreen },
          { path: '/paywall',               Component: PaywallScreen },
        ],
      },

      // Catch-all inside auth'd area
      { path: '*', Component: () => <Navigate to="/home" replace /> },
    ],
  },
])

// ── App (providers + router) ────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <FollowProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--bg-2)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
              },
            }}
          />
        </FollowProvider>
      </NotificationsProvider>
    </AuthProvider>
  )
}
