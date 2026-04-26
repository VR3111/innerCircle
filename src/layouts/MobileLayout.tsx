import { NavLink, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

const ICONS = {
  home: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10l9-7 9 7v11a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V10z"
            stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  leaderboard: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="5" height="9" stroke={c} strokeWidth="1.6"/>
      <rect x="9.5" y="6" width="5" height="15" stroke={c} strokeWidth="1.6"/>
      <rect x="16" y="9" width="5" height="12" stroke={c} strokeWidth="1.6"/>
    </svg>
  ),
  explore: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.6"/>
      <path d="M16 16l5 5" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  messages: (c: string) => (
    // Paper plane — same 22×22 / viewBox 0 0 24 24 / strokeWidth 1.6 as all other nav icons.
    // Stroke is on individual paths (matching home/explore/profile/leaderboard pattern).
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13"
            stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z"
            stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  profile: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6"/>
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

const TABS = [
  { id: 'home',        path: '/home',         label: 'Home' },
  { id: 'leaderboard', path: '/leaderboard',  label: 'Ranks' },
  { id: 'explore',     path: '/explore',      label: 'Explore' },
  { id: 'messages',    path: '/dms',          label: 'Messages' },
  { id: 'profile',     path: '/profile',      label: 'Profile' },
] as const;

/* Solid background — no backdrop-filter (breaks sticky on iOS WebKit) */
export function BottomNav({ accent = '#E9C46A' }: { accent?: string }) {
  const location = useLocation();
  return (
    <nav
      className="relative flex items-center justify-around border-t border-line bg-[rgba(10,10,10,0.96)]"
      style={{ padding: '12px 24px calc(18px + var(--ic-bot-inset, 0px))' }}
    >
      {TABS.map(t => (
        <NavLink
          key={t.id} to={t.path} end
          className="relative p-2 bg-transparent border-0 cursor-pointer"
        >
          {({ isActive }) => {
            // Messages tab is also active on /dm/* thread routes
            const active = t.id === 'messages'
              ? (isActive || location.pathname.startsWith('/dm/'))
              : isActive;
            const c = active ? accent : 'rgba(255,255,255,0.38)';
            return (
              <>
                {ICONS[t.id](c)}
                <span
                  className="absolute bottom-0.5 left-1/2 w-[3px] h-[3px] rounded-full -translate-x-1/2 transition-opacity duration-200"
                  style={{ background: accent, opacity: active ? 1 : 0, boxShadow: active ? `0 0 8px ${accent}` : 'none' }}
                />
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on certain routes. Root path `/` is Splash — exact match needed
  // to avoid hiding nav on all sub-paths (startsWith('/') would match everything).
  const hideNav =
    location.pathname === '/' ||
    ['/post/', '/auth', '/onboarding', '/compose', '/dm/'].some(p =>
      location.pathname.startsWith(p)
    );

  return (
    <div className="fixed inset-0 flex flex-col bg-bg overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      {!hideNav && <BottomNav />}
      {/* expose navigate for legacy non-link callers if needed */}
      <span data-nav-ready data-path={location.pathname} hidden onClick={() => navigate(-1)} />
    </div>
  );
}
