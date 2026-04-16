import { createBrowserRouter, Navigate, Outlet } from "react-router";
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
import ErrorBoundary from "./components/ErrorBoundary";

// Redirects to /auth when there is no session; shows a blank frame while loading
function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public — auth screen
  { path: "/auth", Component: Auth, ErrorBoundary },

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
        ],
      },
    ],
  },
]);
