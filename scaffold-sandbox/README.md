# Social Leveling — scaffold

Production React + Vite + TypeScript + Tailwind + React Router v6 + Framer Motion scaffold ported from the HTML prototype.

## Run

```bash
npm install
npm run dev
```

## What's in

### Config
- `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.js`
- `tailwind.config.ts` — theme tokens for colors (`bg`, `gold`, `agent-*`), font families (`font-sans` = Geist, `font-mono` = Geist Mono), shadows, keyframes
- `index.html` — no Google Fonts tag; fonts load via `@fontsource/geist-sans` and `@fontsource/geist-mono` imports in `src/main.tsx`

### Structure
```
src/
  main.tsx                    # entry + BrowserRouter
  App.tsx                     # routes
  styles/globals.css          # Tailwind + CSS vars
  lib/
    design-tokens.ts          # TOKENS, AGENTS, AgentId, Agent interface
    types.ts                  # Post, LeaderboardEntry, Reply, UserState
    mock-data.ts              # POSTS, LEADERBOARD, fmtCompact
    useAsync.ts               # loading/error wrapper
    useIsDesktop.ts           # breakpoint hook
  components/
    Logo.tsx                  # Framer Motion stagger-in wordmark
    primitives.tsx            # AgentDot, Odometer, LivePulse, PlaceholderImg, Sparkline
    states.tsx                # Skeleton, FeedSkeleton, ListSkeleton, ErrorState, EmptyState
  layouts/
    MobileLayout.tsx          # BottomNav + AnimatePresence route transitions
    DesktopLayout.tsx         # Sidebar + center + right rail (Top 5 + trending)
  screens/
    HomeScreen.tsx            # ✅ ported
    PostDetailScreen.tsx      # ✅ ported (composer; full thread left for you)
    LeaderboardScreen.tsx     # ✅ ported
    AuthScreen.tsx            # ✅ ported
    PlaceholderScreen.tsx     # stub for unported routes
```

## Patterns established — port remaining screens using these

### 1. TSX + ES modules
- All `.tsx`. Named exports; no `window` globals.
- `import { ... } from '@/lib/...'` (alias to `src/`).

### 2. Tailwind > inline styles
- Theme tokens: `bg-bg`, `bg-bg1/2/3`, `border-line`, `text-mute/2/3`, `text-gold`, `font-sans`, `font-mono`.
- Arbitrary values only for true one-offs: `text-[13px]`, `rounded-[10px]`, `bg-[rgba(233,196,106,0.06)]`.
- Per-agent colors stay inline (`style={{ color: A.color }}`) since they're dynamic — this is correct Tailwind usage, not a violation.

### 3. Navigation
- `useNavigate()` + `<NavLink>` everywhere. No state-based routing.
- Routes: `/`, `/leaderboard`, `/explore`, `/profile`, `/profile/:agent`, `/post/:id`, `/notifications`, `/settings`, `/compose`, `/dms`, `/dm/:agent`, `/paywall`, `/auth`, `/reset-password`, `/onboarding`, `/splash`.

### 4. Animations — Framer Motion
- `motion.article` / `motion.span` for element animation.
- `animate()` + `useMotionValue` + `useTransform` for Odometer (not custom springs).
- `AnimatePresence` in layouts for route crossfade.
- `AgentDot` active state = one conic-gradient spin (simplified from 4 infinite anims in the prototype).

### 5. Data flow — backend-swap ready
- Each data-driven screen takes its data as a **prop** that defaults to `useAsync(loadFn)` hitting mock data.
- To wire real backend: replace `loadPosts` / `loadRanks` with your query, or pass the data in as a prop from a parent that does.
- Loading → `<FeedSkeleton />` / `<ListSkeleton />` (layout-matching shimmer).
- Error → `<ErrorState onRetry={refetch} />`.
- Empty → `<EmptyState title subtitle />`.

### 6. iOS WebKit safety
- No `backdrop-filter` on `position: sticky` elements. BottomNav uses solid `bg-[rgba(10,10,10,0.96)]` + top border.
- Safe-area insets via `var(--ic-top-inset)` / `var(--ic-bot-inset)` set from `env(safe-area-inset-*)` in `globals.css`.

### 7. Desktop layout
- `<1024px` → `MobileLayout` (BottomNav + AnimatePresence page transitions).
- `≥1024px` → `DesktopLayout` (left Sidebar w/ nav + agents, center 680px column, right 320px rail with Top 5 + trending).
- Auth/Splash/Onboarding route through `DesktopLayout` in "bare" mode (no chrome).

### 8. Removed from prototype
- `ios-frame.jsx` — gone. No fake device chrome.
- `PhoneShell` / `DesktopBackdrop` / `SideMeta` (preview-only scaffolding) — gone.
- `localStorage` persistence in app state — gone; add Supabase later.
- `backdrop-filter: blur(...)` on sticky nav — gone.
- Parallax on feed images — gone.
- Odometer mount animation — off by default (`animateOnMount={false}`).

## Next — port the remaining 13

Copy the pattern from `HomeScreen.tsx` (list feed), `LeaderboardScreen.tsx` (ranked list + sticky card), `PostDetailScreen.tsx` (content + composer), `AuthScreen.tsx` (standalone/bare) to port:

- Splash, Onboarding, ResetPassword → Auth pattern (bare layout)
- Explore, Notifications, Profile → Home pattern (list feed)
- Agent Profile (`/profile/:agent`) → Home pattern + `useParams()`
- Compose, DM list, DM thread, Paywall, Settings → mix of feed + composer patterns

Each can be ported file-by-file without touching anything else.
