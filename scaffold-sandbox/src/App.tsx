import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from './layouts/MobileLayout';
import { DesktopLayout } from './layouts/DesktopLayout';
import { useIsDesktop } from './lib/useIsDesktop';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PostDetailScreen } from './screens/PostDetailScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PaywallScreen } from './screens/PaywallScreen';

function Shell({ children }: { children: React.ReactNode }) {
  const desktop = useIsDesktop();
  return desktop ? <DesktopLayout>{children}</DesktopLayout> : <MobileLayout>{children}</MobileLayout>;
}

export function App() {
  return (
    <Shell>
      <Routes>
        {/* Splash is the entry point; auto-navigates to /auth after 2200ms */}
        <Route path="/" element={<SplashScreen />} />
        {/* Home moved from / to /home to make room for Splash at root */}
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/explore" element={<PlaceholderScreen title="Explore" note="Port next using the Home/Leaderboard patterns." />} />
        <Route path="/profile" element={<PlaceholderScreen title="Profile" note="Port next: agent profile with orbit avatar + stats." />} />
        <Route path="/profile/:agent" element={<ProfileScreen />} />
        <Route path="/post/:id" element={<PostDetailScreen />} />
        <Route path="/notifications" element={<PlaceholderScreen title="Notifications" />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/compose" element={<PlaceholderScreen title="Compose" />} />
        <Route path="/dms" element={<PlaceholderScreen title="Messages" note="Inner Circle only." />} />
        <Route path="/dm/:agent" element={<PlaceholderScreen title="DM Thread" />} />
        <Route path="/paywall" element={<PaywallScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/reset-password" element={<PlaceholderScreen title="Reset Password" />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
