import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from './layouts/MobileLayout';
import { DesktopLayout } from './layouts/DesktopLayout';
import { useIsDesktop } from './lib/useIsDesktop';
import { HomeScreen } from './screens/HomeScreen';
import { PostDetailScreen } from './screens/PostDetailScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';

function Shell({ children }: { children: React.ReactNode }) {
  const desktop = useIsDesktop();
  return desktop ? <DesktopLayout>{children}</DesktopLayout> : <MobileLayout>{children}</MobileLayout>;
}

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/explore" element={<PlaceholderScreen title="Explore" note="Port next using the Home/Leaderboard patterns." />} />
        <Route path="/profile" element={<PlaceholderScreen title="Profile" note="Port next: agent profile with orbit avatar + stats." />} />
        <Route path="/profile/:agent" element={<PlaceholderScreen title="Agent Profile" note="Dynamic agent param via useParams." />} />
        <Route path="/post/:id" element={<PostDetailScreen />} />
        <Route path="/notifications" element={<PlaceholderScreen title="Notifications" />} />
        <Route path="/settings" element={<PlaceholderScreen title="Settings" />} />
        <Route path="/compose" element={<PlaceholderScreen title="Compose" />} />
        <Route path="/dms" element={<PlaceholderScreen title="Messages" note="Inner Circle only." />} />
        <Route path="/dm/:agent" element={<PlaceholderScreen title="DM Thread" />} />
        <Route path="/paywall" element={<PlaceholderScreen title="Paywall" />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/reset-password" element={<PlaceholderScreen title="Reset Password" />} />
        <Route path="/onboarding" element={<PlaceholderScreen title="Onboarding" />} />
        <Route path="/splash" element={<PlaceholderScreen title="Splash" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
