import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from './layouts/MobileLayout';
import { DesktopLayout } from './layouts/DesktopLayout';
import { useIsDesktop } from './lib/useIsDesktop';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PostDetailScreen } from './screens/PostDetailScreen';
import { ArenasHubScreen } from './screens/ArenasHubScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { CategoryLeaderboardScreen } from './screens/CategoryLeaderboardScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';
import { ComposeScreen } from './screens/ComposeScreen';
import { DMListScreen } from './screens/DMListScreen';
import { DMThreadScreen } from './screens/DMThreadScreen';
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
        <Route path="/leaderboard" element={<ArenasHubScreen />} />
        <Route path="/leaderboard/:category" element={<CategoryLeaderboardScreen />} />
        <Route path="/explore" element={<ExploreScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/:handle" element={<UserProfileScreen />} />
        <Route path="/post/:id" element={<PostDetailScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/compose" element={<ComposeScreen />} />
        <Route path="/dms" element={<DMListScreen />} />
        <Route path="/dm/:threadId" element={<DMThreadScreen />} />
        <Route path="/paywall" element={<PaywallScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/reset-password" element={<PlaceholderScreen title="Reset Password" />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
