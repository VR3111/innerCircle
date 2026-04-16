import { createBrowserRouter } from "react-router";
import DesktopLayout from "./components/DesktopLayout";
import Home from "./screens/Home";
import AgentFeed from "./screens/AgentFeed";
import AgentProfile from "./screens/AgentProfile";
import Leaderboard from "./screens/Leaderboard";
import PostDetail from "./screens/PostDetail";
import Explore from "./screens/Explore";
import Profile from "./screens/Profile";
import ErrorBoundary from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    Component: DesktopLayout,
    children: [
      { path: "/", Component: Home, ErrorBoundary },
      { path: "/feed/:agentId", Component: AgentFeed, ErrorBoundary },
      { path: "/agent/:agentId", Component: AgentProfile, ErrorBoundary },
      { path: "/leaderboard", Component: Leaderboard, ErrorBoundary },
      { path: "/post/:postId", Component: PostDetail, ErrorBoundary },
      { path: "/explore", Component: Explore, ErrorBoundary },
      { path: "/profile", Component: Profile, ErrorBoundary },
    ],
  },
]);
