import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./contexts/AuthContext";
import DesktopLayout from "./components/DesktopLayout";
import Auth from "./screens/Auth";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import AgentFeed from "./screens/AgentFeed";
import AgentProfile from "./screens/AgentProfile";
import Leaderboard from "./screens/Leaderboard";
import PostDetail from "./screens/PostDetail";
import Explore from "./screens/Explore";
import Profile from "./screens/Profile";
import Notifications from "./screens/Notifications";
import Settings from "./screens/Settings";
import ResetPassword from "./screens/ResetPassword";
import ErrorBoundary from "./components/ErrorBoundary";

// Redirects to /auth when there is no session; shows a blank frame while loading.
// When the destination is "/" (onboarding), returning users are sent straight to /home.
function RequireAuth() {
  const { session, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;

  if (location.pathname === '/') {
    const onboarded = localStorage.getItem('onboarded');
    if (onboarded === 'true') {
      return <Navigate to="/home" replace />;
    }
    if (onboarded !== 'false') {
      // No explicit flag (cleared storage / new device) — fall back to account age
      const createdAt = user?.created_at ? new Date(user.created_at).getTime() : 0;
      const isReturningUser = Date.now() - createdAt > 60_000;
      if (isReturningUser) return <Navigate to="/home" replace />;
    }
    // onboarded === 'false' (just signed up) OR account < 60s old → show onboarding
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public routes — no session required
  { path: "/auth",           Component: Auth,          ErrorBoundary },
  { path: "/reset-password", Component: ResetPassword, ErrorBoundary },

  // Everything else requires a session
  {
    Component: RequireAuth,
    children: [
      // Onboarding — first thing a new user sees
      { path: "/", Component: Onboarding, ErrorBoundary },

      // Main app — 3-column desktop layout
      {
        Component: DesktopLayout,
        children: [
          { path: "/home",           Component: Home,        ErrorBoundary },
          { path: "/feed/:agentId",  Component: AgentFeed,   ErrorBoundary },
          { path: "/agent/:agentId", Component: AgentProfile, ErrorBoundary },
          { path: "/leaderboard",    Component: Leaderboard, ErrorBoundary },
          { path: "/post/:postId",   Component: PostDetail,  ErrorBoundary },
          { path: "/explore",        Component: Explore,     ErrorBoundary },
          { path: "/profile",        Component: Profile,     ErrorBoundary },
          { path: "/notifications",  Component: Notifications, ErrorBoundary },
          { path: "/settings",       Component: Settings,      ErrorBoundary },
        ],
      },
    ],
  },
]);
