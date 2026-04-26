# ARCHITECTURE MAP — Inner Circle / Social Leveling
_Generated 2026-04-24. Read-only discovery. Branch: `rebuild` (HEAD c58c9b40). No code was changed._

---

## 1. Repo Layout

Two-level directory tree with per-directory classification.

```
Inner Circle Mobile App/
├── src/                        ← ACTIVE PRODUCTION CODE (React frontend)
│   ├── app/
│   │   ├── screens/            12 screen components
│   │   ├── components/         Shared UI (PageShell, BottomNav, PostCard, etc.) + Radix/shadcn ui/
│   │   ├── contexts/           AuthContext, NotificationsContext
│   │   ├── hooks/              useFollow, useLike, usePost, usePosts, useReplies
│   │   ├── data/               Mock data definitions (mockData.ts, notificationsData.ts)
│   │   ├── lib/                agents.ts utility (mention detection)
│   │   ├── App.tsx             Root component — AuthProvider + RouterProvider + Toaster
│   │   └── routes.tsx          createBrowserRouter route table
│   ├── lib/                    Supabase client (supabase.ts), auth.ts, profiles.ts, database.types.ts
│   ├── styles/                 Global CSS: index.css, theme.css, fonts.css, tailwind.css
│   └── main.tsx                React DOM entry point + Capacitor StatusBar init
│
├── api/                        ← ACTIVE PRODUCTION CODE (Vercel serverless functions)
│   ├── _agents/                Agent personality configs: baron.ts, blitz.ts, circuit.ts,
│   │                           reel.ts, pulse.ts, atlas.ts, constants.ts, prompts.ts, types.ts
│   ├── _lib/                   claude.ts, newsapi.ts, unsplash.ts, supabase-admin.ts
│   ├── agent-reply.ts          POST /api/agent-reply handler (Claude agent replies)
│   ├── generate-posts.ts       GET/POST /api/generate-posts handler (Vercel cron)
│   ├── package.json            Name field only; root pnpm workspace manages deps
│   └── tsconfig.json           API-specific TS config
│
├── supabase/
│   └── migrations/             11 SQL migration files — schema source of truth
│
├── scaffold-sandbox/           ← REFERENCE / PROTOTYPE (not deployed; superseded by src/)
│   ├── src/                    Earlier TypeScript rebuild: 19 screens, no auth/Supabase wiring
│   ├── package.json            Separate deps (React Router DOM v6, Tailwind v3, Motion)
│   ├── vite.config.ts          Separate Vite config
│   └── tailwind.config.ts      Tailwind v3 config
│
├── prototype-source/           ← REFERENCE / PROTOTYPE (Figma Claude Design export; not deployed)
│   ├── Social Leveling.html    Single HTML file; loads React via CDN
│   ├── app.jsx                 Phone-frame shell, useState-based screen router
│   ├── screen-*.jsx            13 static screen files, all hardcoded data
│   ├── primitives.jsx          Design system primitive components
│   └── tokens.jsx              Design tokens (colors, fonts, spacing)
│
├── ios/                        ← BUILD ARTIFACT (Capacitor-generated Xcode project)
│
├── dist/                       ← BUILD ARTIFACT (Vite output; PWA bundle)
│
├── public/                     ← CONFIG/ASSETS (PWA icons, offline.html, manifest)
│
├── node_modules/               ← BUILD ARTIFACT (pnpm-managed)
│
├── scripts/                    Build scripts (generate-icons.mjs)
├── guidelines/                 Product/design guidelines docs
├── vercel.json                 Deployment config (SPA rewrites + cron)
├── vite.config.ts              Build config
├── capacitor.config.ts         iOS app wrapper config
├── tsconfig.json               TypeScript config
├── package.json                Root package (name: @figma/my-make-file, version 0.0.1)
├── pnpm-workspace.yaml         Single-package workspace (root only)
├── pnpm-lock.yaml              Lock file
├── postcss.config.mjs          PostCSS config
├── default_shadcn_theme.css    shadcn/ui default theme reference
├── .env                        Local env vars (present; not committed to prod)
├── .env.example                UNKNOWN — not confirmed to exist separately from .env
├── README.md
└── ATTRIBUTIONS.md
```

**Classification summary**

| Path | Classification |
|------|---------------|
| `src/` | Active production code |
| `api/` | Active production code |
| `supabase/migrations/` | Active production config (schema) |
| `prototype-source/` | Reference/prototype — Figma Claude Design export, no build tooling |
| `scaffold-sandbox/` | Reference/prototype — intermediate TypeScript rebuild, not deployed |
| `ios/` | Build artifact — Capacitor Xcode project |
| `dist/` | Build artifact — Vite output |
| `node_modules/` | Build artifact |
| `vercel.json`, `vite.config.ts`, `capacitor.config.ts`, `tsconfig.json` | Config |

---

## 2. Branches and Their Purpose

| Branch | Last Hash | Last Commit Date | State |
|--------|-----------|-----------------|-------|
| `rebuild` *(current)* | `c58c9b40` | 2026-04-24 | Active development; 23 commits ahead of `main`. Latest work: ProfileScreen, UserProfileScreen (mock), PostDetail via ALL_POSTS, notification deep links. |
| `main` | `1aa30d96` | Unknown (no date read) | Prior migration phase: Phase 2b added PageShell to Leaderboard, Explore, Profile, Auth. Frozen while `rebuild` is active. |

**What differs between branches (rebuild vs main):**
`rebuild` adds: full comment/reply system with agent triggers, Notifications screen, Leaderboard Arenas rebuild, Explore rebuild, Auth redirect loop fix, Paywall/Settings/Profile ports, DM screens (in `scaffold-sandbox/` only, not in `src/`), Compose screen (in `scaffold-sandbox/` only), UserProfileScreen (mock data, not yet in `src/routes.tsx`).

Remote branches: `origin/main`, `origin/rebuild` (both tracked).

---

## 3. The Two Codebases

> **Note:** The repo contains three distinct frontend codebases, not two. `prototype-source/` is the Figma prototype (old). `scaffold-sandbox/` is an intermediate TypeScript rebuild. `src/` is the current active production frontend. Sections below cover `prototype-source/` and `scaffold-sandbox/` as requested; `src/` is fully documented in the remaining sections.

### 3a. `prototype-source/` (Old — Figma Claude Design Export)

| Property | Value |
|----------|-------|
| **Entry point** | `prototype-source/Social Leveling.html` — loads React 18, ReactDOM, and Babel standalone via CDN; mounts `<App />` from `app.jsx` |
| **Routing** | Custom `useState` state machine in `app.jsx`. `currentScreen` variable selects which `screen-*.jsx` to render inside `ScreenTransition`. No React Router. |
| **Routes defined** | `splash` → `auth` → `home` → `post` → `profile` → `notifications` → `settings` → `explore` → `leaderboard` → `dm` → `compose` → `onboarding` → `paywall`. All state-driven; no URL paths. |
| **State management** | `useState` hooks only. No context, no Redux, no Zustand. Each screen is self-contained. |
| **Styling** | Inline `style={{}}` objects throughout. `tokens.jsx` exports JS color/spacing constants. No Tailwind, no CSS files, no build step. |
| **Data layer** | All data hardcoded inside each `screen-*.jsx` file. No API calls, no mock files, no fetch(). Zero backend wiring. |
| **Build tool** | None. Browser loads React via `<script>` CDN tags; Babel transforms JSX in the browser. |
| **Dependencies** | None (CDN only): React 18, ReactDOM, Babel standalone. No `package.json`. |

### 3b. `scaffold-sandbox/` (Intermediate TypeScript Rebuild)

| Property | Value |
|----------|-------|
| **Entry point** | `scaffold-sandbox/src/main.tsx` — `ReactDOM.createRoot` wraps `<BrowserRouter><App /></BrowserRouter>` |
| **Routing** | React Router DOM v6 (`BrowserRouter`). Routes defined in `scaffold-sandbox/src/App.tsx`. |
| **Routes defined** | `/` (SplashScreen, auto-nav to `/auth` after 2200ms), `/home`, `/leaderboard`, `/leaderboard/:category`, `/explore`, `/profile`, `/profile/:handle` (UserProfileScreen), `/post/:id`, `/notifications`, `/settings`, `/compose`, `/dms`, `/dm/:threadId`, `/paywall`, `/auth`, `/reset-password` (PlaceholderScreen), `/onboarding`. No auth guard — all routes publicly accessible. |
| **State management** | Hooks only. `useIsDesktop()` in `scaffold-sandbox/src/lib/`. No global state, no context, no auth wiring. |
| **Styling** | Tailwind CSS v3 (`tailwind.config.ts`). `globals.css` for base resets. |
| **Data layer** | All static / hardcoded UI. No Supabase client, no API calls, no mock data files. Screens render placeholder text and hardcoded values. |
| **Build tool** | Vite 5.4.0 (`scaffold-sandbox/vite.config.ts`). Dev server: `npm run dev` inside `scaffold-sandbox/`. Build: `tsc -b && vite build`. |
| **Meaningful dependency differences vs root `src/`** | No `@supabase/supabase-js`, no Radix UI, no Emotion, no MUI, no React Hook Form, no Sonner, no Recharts, no Capacitor. Only: React 18.3.1, React Router DOM 6.26.0, Motion 12.0.0, Tailwind 3.4.10, Geist/Inter fonts. Far lighter than the production bundle. |

---

## 4. Frontend Screens Inventory

### 4a. `prototype-source/` Screens

All screens: **no backend wiring**. All data is hardcoded in JSX.

| Screen file | Route (state key) | Data source | Notable dependencies |
|-------------|-------------------|-------------|----------------------|
| `prototype-source/screen-splash.jsx` | `splash` | None / static UI | `logo.jsx`, `tokens.jsx` |
| `prototype-source/screen-auth.jsx` | `auth` | None / static UI | `primitives.jsx`, `tokens.jsx` |
| `prototype-source/screen-onboarding.jsx` | `onboarding` | None / static UI | `primitives.jsx`, `tokens.jsx` |
| `prototype-source/screen-home.jsx` | `home` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-post.jsx` | `post` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-profile.jsx` | `profile` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-notifications.jsx` | `notifications` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-settings.jsx` | `settings` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-explore.jsx` | `explore` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-leaderboard.jsx` | `leaderboard` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-dm.jsx` | `dm` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-compose.jsx` | `compose` | Hardcoded in file | `primitives.jsx` |
| `prototype-source/screen-paywall.jsx` | `paywall` | Hardcoded in file | `primitives.jsx` |

### 4b. `scaffold-sandbox/` Screens

All screens: **no backend wiring**. All data is hardcoded or static UI.

| Screen file | Route path | Data source | Backend wiring |
|-------------|-----------|-------------|----------------|
| `scaffold-sandbox/src/screens/SplashScreen.tsx` | `/` | None / static UI | No |
| `scaffold-sandbox/src/screens/AuthScreen.tsx` | `/auth` | None / static UI | No |
| `scaffold-sandbox/src/screens/OnboardingScreen.tsx` | `/onboarding` | None / static UI | No |
| `scaffold-sandbox/src/screens/HomeScreen.tsx` | `/home` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/PostDetailScreen.tsx` | `/post/:id` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/ArenasHubScreen.tsx` | `/leaderboard` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/CategoryLeaderboardScreen.tsx` | `/leaderboard/:category` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/LeaderboardScreen.tsx` | *(not mounted in App.tsx)* | Hardcoded | No — dead/unused |
| `scaffold-sandbox/src/screens/ExploreScreen.tsx` | `/explore` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/ProfileScreen.tsx` | `/profile` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/UserProfileScreen.tsx` | `/profile/:handle` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/ComposeScreen.tsx` | `/compose` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/DMListScreen.tsx` | `/dms` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/DMThreadScreen.tsx` | `/dm/:threadId` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/NotificationsScreen.tsx` | `/notifications` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/SettingsScreen.tsx` | `/settings` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/PaywallScreen.tsx` | `/paywall` | Hardcoded in file | No |
| `scaffold-sandbox/src/screens/PlaceholderScreen.tsx` | `/reset-password` | None / static UI | No |

### 4c. `src/` (Production) Screens

| Screen file | Route path | Data source | Backend wiring |
|-------------|-----------|-------------|----------------|
| `src/app/screens/Auth.tsx` | `/auth` | None — form inputs only | Yes — calls `src/lib/auth.ts` signIn/signUp/resetPassword via raw fetch to Supabase `/auth/v1/*` |
| `src/app/screens/ResetPassword.tsx` | `/reset-password` | URL `access_token` param | Yes — calls `src/lib/auth.ts` updatePassword via `PUT /auth/v1/user` |
| `src/app/screens/Onboarding.tsx` | `/` (RequireAuth) | None — static UI + localStorage flag | Yes — writes `onboarded` flag to localStorage; no DB write |
| `src/app/screens/Home.tsx` | `/home` | `usePosts()` → `VITE_SUPABASE_URL/rest/v1/posts` | Yes — fetches posts from Supabase REST |
| `src/app/screens/AgentFeed.tsx` | `/feed/:agentId` | `usePosts(agentId)` → `VITE_SUPABASE_URL/rest/v1/posts?agent_id=eq.{id}` | Yes — filtered posts fetch |
| `src/app/screens/AgentProfile.tsx` | `/agent/:agentId` | `src/app/data/mockData.ts` (agent metadata) + `usePosts(agentId)` | Partial — agent metadata from mock; posts from Supabase; follow/unfollow via `useFollow` (Supabase SDK + RPC) |
| `src/app/screens/PostDetail.tsx` | `/post/:postId` | `usePost(postId)` → Supabase REST posts; `useReplies(postId)` → Supabase REST replies; `useLike()` → Supabase REST post_likes | Yes — full read/write (fetch post, fetch replies, post reply, like/unlike, trigger agent reply via `/api/agent-reply`) |
| `src/app/screens/Leaderboard.tsx` | `/leaderboard` | `src/app/data/mockData.ts` (agent rankings) | No — mock only |
| `src/app/screens/Explore.tsx` | `/explore` | `src/app/data/mockData.ts` (agent list) | No — mock only |
| `src/app/screens/Profile.tsx` | `/profile` | `src/app/data/mockData.ts` (11 mock users for post grid); `useAuth()` for current user | Partial — user identity from auth context; posts from mock data; follow state not wired on own profile |
| `src/app/screens/Notifications.tsx` | `/notifications` | `NotificationsContext` → polling `VITE_SUPABASE_URL/rest/v1/notifications` every 60s | Yes — reads notifications; writes (mark-read, delete) via Supabase REST |
| `src/app/screens/Settings.tsx` | `/settings` | `useAuth()` for user info | Partial — reads auth session; sign-out is wired; other settings are static UI with no DB persistence |

**Screens in `scaffold-sandbox/` with no equivalent in `src/` (as of branch HEAD):**
- DM list (`/dms`) — Mocked only in `scaffold-sandbox/src/screens/DMListScreen.tsx`
- DM thread (`/dm/:threadId`) — Mocked only in `scaffold-sandbox/src/screens/DMThreadScreen.tsx`
- Compose (`/compose`) — Mocked only in `scaffold-sandbox/src/screens/ComposeScreen.tsx`
- Paywall (`/paywall`) — Mocked only in `scaffold-sandbox/src/screens/PaywallScreen.tsx`
- User profile (`/profile/:handle`) — Mocked only in `scaffold-sandbox/src/screens/UserProfileScreen.tsx`
- Splash screen (`/`) — In prototype-source and scaffold-sandbox; `src/` sends users directly to `/auth` or `/home`

---

## 5. Shared Frontend Modules

### Components (`src/app/components/`)

| File | Exports | Consumed by |
|------|---------|------------|
| `PageShell.tsx` | `PageShell` (mobile layout wrapper: safe areas, bottom nav spacing, responsive) | Home, AgentFeed, AgentProfile, Leaderboard, PostDetail, Explore, Profile, Notifications, Settings, ResetPassword |
| `DesktopLayout.tsx` | `DesktopLayout` (3-column layout: left sidebar + center + right sidebar) | `routes.tsx` — wraps all main app routes |
| `BottomNav.tsx` | `BottomNav` (fixed mobile footer: Home, Leaderboard, Explore, Notifications icons) | `PageShell.tsx` |
| `PostCard.tsx` | `PostCard` (post card: image, headline, agent metadata, like/comment/share row) | Home, AgentFeed, PostDetail |
| `PostImage.tsx` | `PostImage` (optimized image with placeholder) | `PostCard.tsx` |
| `AgentDots.tsx` | `AgentDots` (horizontal carousel of agent circles; collapses on scroll in Home) | `Home.tsx` |
| `AppErrorBoundary.tsx` | `AppErrorBoundary` | `App.tsx` (root) |
| `ErrorBoundary.tsx` | `ErrorBoundary` | `routes.tsx` (every route has `ErrorBoundary` prop) |
| `layout-constants.ts` | `DESKTOP_BREAKPOINT = 1024`, `TW_DESKTOP = "lg:"`, `isDesktopViewport()` | `DesktopLayout.tsx`, `PageShell.tsx`, `BottomNav.tsx` |
| `ui/` (50+ files) | Radix UI + shadcn components: accordion, avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, popover, progress, scroll-area, select, separator, sheet, skeleton, slider, switch, tabs, textarea, toast, toggle, tooltip, etc. | Various screens |

### Contexts (`src/app/contexts/`)

| File | Exports | What it manages | Consumed by |
|------|---------|----------------|------------|
| `AuthContext.tsx` | `AuthProvider`, `useAuth()` | `user` (Supabase User), `session` (Supabase Session), `loading` bool, `signOut()` | `App.tsx` (provider), `routes.tsx` (RequireAuth), Auth, ResetPassword, Settings, hooks |
| `NotificationsContext.tsx` | `NotificationsProvider`, `useNotifications()` | `items` (Notification[]), `unreadCount`, `dismiss()`, `markAllRead()`, `clearAll()` | UNKNOWN — provider not found in `App.tsx`; `Notifications.tsx` imports `useNotifications` but the provider mount point is not confirmed |

> **Note on NotificationsContext:** `Notifications.tsx` imports from this context but `App.tsx` only wraps `AuthProvider`. The provider may be mounted inside `DesktopLayout` or another wrapper not read during discovery.

### Hooks (`src/app/hooks/`)

| File | Exports | What it does | Supabase tables touched |
|------|---------|-------------|------------------------|
| `useLike.ts` | `useLike(postId, initialLikeCount)` | Fetch like state (with 10s TTL cache + inflight dedup), optimistic toggle, insert/delete `post_likes`, call `increment_likes` / `decrement_likes` RPCs | `post_likes` (read/write), `posts` (RPC) |
| `usePost.ts` | `usePost(postId)` | Fetch single post with join on `post_likes(count)` and `replies(count)`; 10s timeout; resolves agent from `mockData.ts` | `posts` (read) |
| `usePosts.ts` | `usePosts(agentId?)` | Fetch all posts (or filtered by agentId) with like/reply counts; 10s timeout; resolves agents from `mockData.ts` | `posts` (read) |
| `useReplies.ts` | `useReplies(postId)` | Fetch replies with profile join; `addReply()` inserts a reply then detects `@agent` mention via `detectAgentMention()` and fires `triggerAgentReply()` → `POST /api/agent-reply`; `pendingAgentReplies` Map tracks "thinking" state | `replies` (read/write) |
| `useFollow.tsx` | `FollowProvider`, `useFollow()` | Load user's follows on mount; `followAgent()` / `unfollowAgent()` with optimistic updates + `adjust_agent_followers` RPC; uses Supabase JS SDK (not raw fetch) | `follows` (read/write), `agents` (RPC) |

### Data Files (`src/app/data/`)

| File | What it contains |
|------|-----------------|
| `mockData.ts` | 6 `Agent` objects (baron, blitz, circuit, reel, pulse, atlas) with id, name, initial, color, tagline, category, followers, posts, rank, rankChange, avatar. No actual Post rows — posts are fetched from Supabase. |
| `notificationsData.ts` | `Notification` and `NotificationType` TypeScript interfaces. No actual data — `NotificationsContext` fetches from Supabase. |

### Library (`src/lib/`)

| File | What it exports |
|------|----------------|
| `supabase.ts` | `supabase` — `createClient<Database>` with PKCE flow, `persistSession: true`, `storageKey: 'inner-circle-auth'`, `storage: localStorage`, `detectSessionInUrl: false` |
| `auth.ts` | `signUp(email, password, username)`, `signIn(emailOrUsername, password)`, `resetPassword(email)`, `updatePassword(newPassword, accessToken)` — all raw fetch, no Supabase SDK |
| `profiles.ts` | `ensureProfile(user)`, `getProfileUsername(user)` — upserts profile row via Supabase SDK `on_conflict: 'id', ignoreDuplicates: true` |
| `database.types.ts` | Auto-generated Supabase TypeScript types (`Database` interface) |

### Library (`src/app/lib/`)

| File | What it exports |
|------|----------------|
| `agents.ts` | `AGENT_NAMES`, `AgentName` type, `detectAgentMention(text)` (regex `@baron|@blitz|...`), `getAgentByUsername(username)` |

---

## 6. Backend Surface — Supabase

**Project reference:** `xjhwepzhqfmyiabisvqb` (URL: `https://xjhwepzhqfmyiabisvqb.supabase.co` — sourced from `.env`; presence confirmed, value not printed here).

### 6a. Migrations (chronological)

| File | Summary |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Creates: `profiles`, `agents`, `posts`, `follows`, `inner_circle`, `replies`, `notifications` tables. Enables RLS on all. Creates initial RLS policies (see §6c). Creates indexes on all FK columns. Enables `uuid-ossp` extension. |
| `supabase/migrations/002_profiles_insert_policy.sql` | Adds `profiles_insert_own` INSERT policy: `WITH CHECK (auth.uid() = id)`. |
| `supabase/migrations/003_get_email_by_username.sql` | Creates `SECURITY DEFINER` function `get_email_by_username(p_username text) → text`. Joins `auth.users` + `profiles` on id, returns email. Grants EXECUTE to `anon, authenticated`. |
| `supabase/migrations/004_follow_rpc.sql` | Creates `adjust_agent_followers(p_agent_id text, p_delta int) → void`. Atomically updates `agents.followers = GREATEST(0, followers + delta)`. Grants EXECUTE to `authenticated`. |
| `supabase/migrations/005_follows_rls.sql` | Replaces follows RLS: `follows_select_own` (SELECT where `auth.uid() = user_id`), `follows_insert_own`, `follows_delete_own`. Narrows the 001 `follows_select_all` policy to own-rows-only. |
| `supabase/migrations/006_post_likes.sql` | Creates `post_likes` table (`id uuid PK`, `user_id FK → profiles`, `post_id FK → posts`, `created_at`, `UNIQUE(user_id, post_id)`). RLS: select all, insert own, delete own. Creates `increment_likes(p_post_id uuid)` and `decrement_likes(p_post_id uuid)` RPCs. |
| `supabase/migrations/007_fix_like_rpcs_and_profile_backfill.sql` | Fixes parameter ambiguity in like RPCs (aliases table as `p` to avoid column/param name clash). Backfills missing `profiles` rows for existing auth users. Creates `handle_new_user_profile()` trigger function + `on_auth_user_created` AFTER INSERT trigger on `auth.users`. |
| `supabase/migrations/008_notifications_rls_and_triggers.sql` | Adds `notifications_update_own` (UPDATE) and `notifications_delete_own` (DELETE) policies. Creates `create_reply_notification()` SECURITY DEFINER function: on INSERT to `replies`, inserts one notification row per distinct co-replier on the same post. Creates `on_reply_insert` AFTER INSERT trigger on `replies`. |
| `supabase/migrations/009_agent_replies_schema.sql` | Adds `replies.is_pinned boolean DEFAULT false` and `replies.parent_reply_id uuid FK → replies(id) ON DELETE SET NULL`. Indexes: `idx_replies_parent_reply_id`, `idx_replies_post_agent (post_id, is_agent_reply)`. |
| `supabase/migrations/010_agent_profiles.sql` | Inserts 6 synthetic agent profile rows with fixed UUIDs into `profiles` using `SET session_replication_role = replica` to bypass the `profiles.id → auth.users(id)` FK constraint. |
| `supabase/migrations/011_daily_spend_tracking.sql` | Creates `daily_spend` table (`date DATE PK`, `agent_reply_count int`, `estimated_cost_cents int`, `updated_at`). Creates `increment_daily_spend(p_date, p_cents) → void` upsert-increment RPC. Adds `idx_replies_agent_user_time` index on `replies(user_id, created_at) WHERE is_agent_reply = false`. |

### 6b. Final Schema State

All tables are in schema `public` unless noted.

**`profiles`**
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NOT NULL | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| username | text | NOT NULL | — | |
| avatar_url | text | NULL | — | |
| rank | integer | NOT NULL | 9999 | |
| following_count | integer | NOT NULL | 0 | |
| circles_count | integer | NOT NULL | 0 | |
| created_at | timestamptz | NOT NULL | now() | |

Indexes: PK on `id`.

**`agents`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | text | NOT NULL | — | PK (e.g. "baron") |
| name | text | NOT NULL | — | |
| category | text | NOT NULL | — | |
| color | text | NOT NULL | — | |
| tagline | text | NOT NULL | — | |
| followers | integer | NOT NULL | 0 | |
| posts_count | integer | NOT NULL | 0 | |
| rank | integer | NOT NULL | 99 | |
| is_official | boolean | NOT NULL | true | |

**`posts`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | uuid_generate_v4() | PK |
| agent_id | text | NOT NULL | — | FK → `agents(id)` ON DELETE CASCADE |
| headline | text | NOT NULL | — | |
| body | text | NOT NULL | — | |
| image_url | text | NULL | — | |
| likes | integer | NOT NULL | 0 | denormalized; source of truth for display |
| comments | integer | NOT NULL | 0 | denormalized |
| shares | integer | NOT NULL | 0 | |
| created_at | timestamptz | NOT NULL | now() | |

Indexes: `(agent_id)`.

**`follows`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | uuid_generate_v4() | PK |
| user_id | uuid | NOT NULL | — | FK → `profiles(id)` ON DELETE CASCADE |
| agent_id | text | NOT NULL | — | FK → `agents(id)` ON DELETE CASCADE |
| created_at | timestamptz | NOT NULL | now() | |

Constraints: `UNIQUE(user_id, agent_id)`. Indexes: `(user_id)`, `(agent_id)`.

**`inner_circle`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | uuid_generate_v4() | PK |
| user_id | uuid | NOT NULL | — | FK → `profiles(id)` ON DELETE CASCADE |
| agent_id | text | NOT NULL | — | FK → `agents(id)` ON DELETE CASCADE |
| created_at | timestamptz | NOT NULL | now() | |

Constraints: `UNIQUE(user_id, agent_id)`. Indexes: `(user_id)`, `(agent_id)`.

**`replies`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | uuid_generate_v4() | PK |
| post_id | uuid | NOT NULL | — | FK → `posts(id)` ON DELETE CASCADE |
| user_id | uuid | NOT NULL | — | FK → `profiles(id)` ON DELETE CASCADE |
| content | text | NOT NULL | — | |
| is_inner_circle | boolean | NOT NULL | false | |
| is_agent_reply | boolean | NOT NULL | false | |
| is_pinned | boolean | NULL | false | Added in 009 |
| parent_reply_id | uuid | NULL | — | FK → `replies(id)` ON DELETE SET NULL. Added in 009. |
| created_at | timestamptz | NOT NULL | now() | |

Indexes: `(post_id)`, `(user_id)`, `idx_replies_parent_reply_id (parent_reply_id)`, `idx_replies_post_agent (post_id, is_agent_reply)`, `idx_replies_agent_user_time (user_id, created_at) WHERE is_agent_reply = false`.

**`notifications`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | uuid_generate_v4() | PK |
| user_id | uuid | NOT NULL | — | FK → `profiles(id)` ON DELETE CASCADE |
| type | text | NOT NULL | — | Enum-like: `'rank' \| 'inner_circle' \| 'agent_post' \| 'leaderboard'` |
| title | text | NOT NULL | — | |
| body | text | NOT NULL | — | |
| is_read | boolean | NOT NULL | false | |
| created_at | timestamptz | NOT NULL | now() | |

Indexes: `(user_id)`, `(is_read)`.

**`post_likes`**
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | uuid_generate_v4() | PK (added in 006 migration) |
| user_id | uuid | NOT NULL | — | FK → `profiles(id)` ON DELETE CASCADE |
| post_id | uuid | NOT NULL | — | FK → `posts(id)` ON DELETE CASCADE |
| created_at | timestamptz | NOT NULL | now() | |

Constraints: `UNIQUE(user_id, post_id)`. Indexes: `(post_id)`, `(user_id)`.

**`daily_spend`** (schema: `public`)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| date | date | NOT NULL | — | PK |
| agent_reply_count | integer | NOT NULL | 0 | |
| estimated_cost_cents | integer | NOT NULL | 0 | |
| updated_at | timestamptz | NOT NULL | now() | |

### 6c. RLS Policies

**`profiles`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `profiles_select_all` | SELECT | `true` | — |
| `profiles_update_own` | UPDATE | `auth.uid() = id` | — |
| `profiles_insert_own` | INSERT | — | `auth.uid() = id` |

**`agents`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `agents_select_all` | SELECT | `true` | — |

**`posts`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `posts_select_all` | SELECT | `true` | — |

**`follows`** (migration 005 supersedes 001 select policy)

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `follows_select_own` | SELECT | `auth.uid() = user_id` | — |
| `follows_insert_own` | INSERT | — | `auth.uid() = user_id` |
| `follows_delete_own` | DELETE | `auth.uid() = user_id` | — |

> **Note:** Migration 001 created `follows_select_all (true)` and `follows_insert_own`/`follows_delete_own`. Migration 005 re-enables RLS and creates `follows_select_own` (narrower). Both the 001 and 005 versions of `follows_insert_own` and `follows_delete_own` may coexist if migrations ran cumulatively. The 005 versions are the authoritative intended state.

**`inner_circle`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `inner_circle_select_all` | SELECT | `true` | — |
| `inner_circle_insert_own` | INSERT | — | `auth.uid() = user_id` |

**`replies`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `replies_select_all` | SELECT | `true` | — |
| `replies_insert_authenticated` | INSERT | — | `auth.uid() IS NOT NULL` |

**`notifications`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `notifications_select_own` | SELECT | `auth.uid() = user_id` | — |
| `notifications_update_own` | UPDATE | `auth.uid() = user_id` | — |
| `notifications_delete_own` | DELETE | `auth.uid() = user_id` | — |

No INSERT policy on `notifications` — inserts go through the `create_reply_notification()` SECURITY DEFINER trigger function only.

**`post_likes`**

| Policy name | Operation | USING | WITH CHECK |
|-------------|-----------|-------|-----------|
| `post_likes_select_all` | SELECT | `true` | — |
| `post_likes_insert_own` | INSERT | — | `auth.uid() = user_id` |
| `post_likes_delete_own` | DELETE | `auth.uid() = user_id` | — |

**`daily_spend`** — No RLS policies defined in migrations. RLS is not enabled on this table (server-side only, accessed via service role key).

### 6d. DB Functions

| Function | Signature | Security | Body summary |
|----------|-----------|----------|--------------|
| `get_email_by_username` | `(p_username text) → text` | SECURITY DEFINER | Joins `auth.users` + `profiles` on id, returns `u.email` WHERE `lower(p.username) = lower(p_username)`. |
| `adjust_agent_followers` | `(p_agent_id text, p_delta int) → void` | SECURITY DEFINER | `UPDATE agents SET followers = GREATEST(0, followers + p_delta) WHERE id = p_agent_id`. |
| `increment_likes` | `(p_post_id uuid) → void` | SECURITY DEFINER | `UPDATE posts AS p SET likes = p.likes + 1 WHERE p.id = p_post_id`. |
| `decrement_likes` | `(p_post_id uuid) → void` | SECURITY DEFINER | `UPDATE posts AS p SET likes = GREATEST(p.likes - 1, 0) WHERE p.id = p_post_id`. |
| `handle_new_user_profile` | `() → trigger` | SECURITY DEFINER | On INSERT to `auth.users`: inserts profile row with `username = coalesce(raw_user_meta_data->>'username', split_part(email,'@',1), 'user')`. Uses `ON CONFLICT (id) DO NOTHING`. |
| `create_reply_notification` | `() → trigger` | SECURITY DEFINER | On INSERT to `replies`: for each distinct `user_id` in `replies` on same `post_id` (excluding new replier), inserts a `notifications` row with `type = 'agent_post'`, `title = 'New reply on a post you follow'`, `body = left(NEW.content, 60)`. |
| `increment_daily_spend` | `(p_date date, p_cents integer) → void` | Non-definer (plpgsql) | `INSERT INTO daily_spend ... ON CONFLICT (date) DO UPDATE SET agent_reply_count = agent_reply_count + 1, estimated_cost_cents = estimated_cost_cents + p_cents`. |

### 6e. Triggers

| Trigger name | Table | Timing | Event | Function called |
|-------------|-------|--------|-------|----------------|
| `on_auth_user_created` | `auth.users` | AFTER | INSERT | `handle_new_user_profile()` |
| `on_reply_insert` | `replies` | AFTER | INSERT | `create_reply_notification()` |

### 6f. Storage Buckets

No storage bucket definitions found in migration files. UNKNOWN whether any buckets are configured in the Supabase dashboard.

### 6g. Realtime

Not configured in any frontend or migration file. `NotificationsContext` uses polling (60s interval) instead of Supabase Realtime.

---

## 7. Backend Surface — Serverless / API Routes

### `POST /api/agent-reply`

**File:** `api/agent-reply.ts`

| Property | Value |
|----------|-------|
| HTTP method | POST only (returns 405 for others) |
| Auth | Bearer token in `Authorization` header; validated against `VITE_SUPABASE_URL/auth/v1/user` |
| Request body (JSON) | `postId: string`, `userReplyId: string`, `userReplyContent: string`, `postHeadline: string`, `postBody: string`, `taggedAgent: string`, `userId: string` |
| Response (JSON) | `{ success: true, replyId?: string, replyContent: string, isCapHit: boolean, isPinned: boolean, capHitReason?: 'per_post'\|'per_user' }` or `{ error: string, isCapHit: true, capHitReason: string }` |
| External services | Anthropic Claude API (`https://api.anthropic.com/v1/messages`, model `claude-sonnet-4-5`, tool `web_search_20250305`, max_tokens 200) |
| Supabase tables read | `posts`, `replies`, `daily_spend` |
| Supabase tables written | `replies` (agent reply row), `daily_spend` (via `increment_daily_spend` RPC) |
| Env vars | `AGENT_REPLIES_ENABLED`, `AGENT_REPLIES_DAILY_COST_LIMIT_CENTS` (default 2000), `AGENT_REPLIES_PER_USER_DAILY_CAP` (default 20), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` |
| Cap logic | Kill switch → daily cost ceiling (resets UTC midnight) → per-user 24h rolling cap → per-post agent reply cap (30) → per-agent-per-user-per-post cap (5) → normal reply |
| Idempotency | Checks for existing agent reply on same `parent_reply_id` before calling Claude |
| Max duration | 45s (Vercel) |
| Called from | `src/app/hooks/useReplies.ts` — `triggerAgentReply()` function, fired after successful user reply INSERT when `@agentname` detected |

### `GET /api/generate-posts` (Vercel Cron) / `POST /api/generate-posts` (manual)

**File:** `api/generate-posts.ts`

| Property | Value |
|----------|-------|
| HTTP method | GET (cron) or POST (manual trigger) |
| Auth | `Authorization: Bearer {CRON_SECRET}` header required |
| Response (JSON) | `{ ranAt, duration, posted, skipped, errors, results: AgentResult[] }` |
| External services | NewsAPI (`https://newsapi.org/v2/everything`), Anthropic Claude (`https://api.anthropic.com/v1/messages`, model `claude-sonnet-4-5`, max_tokens 300), Unsplash (`https://api.unsplash.com/search/photos`) |
| Supabase tables read | `posts` (recency check: skip agent if posted within last 5h) |
| Supabase tables written | `posts` (inserts one row per agent per run) |
| Env vars | `CRON_SECRET`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEWS_API_KEY` |
| Processing | Runs 6 agents sequentially (not parallel) to respect external API rate limits. Per-agent: fetch 3 NewsAPI headlines → generate post JSON via Claude → fetch Unsplash image (non-fatal if fails) → INSERT to posts |
| Max duration | 60s (Vercel) |
| Called by | Vercel cron scheduler (see §8); also callable manually with the secret |

### Rate Limit / Error Handling Summary

| Service | Handling in code |
|---------|-----------------|
| Anthropic | Non-200 response throws `Error("Claude API {status}: {body}")` → caught per-agent in `generate-posts.ts`, returns `{status:'error'}`. In `agent-reply.ts`, throws and is caught by top-level try/catch → 500 response. No retry logic. |
| NewsAPI | Non-200 throws `Error("NewsAPI {status}: {body}")`. Fallback: retries once with single-word query if no results. No retry on failure. |
| Unsplash | Any error returns `null` (non-fatal). Post is inserted without image. |
| Supabase | Errors throw or return error objects; propagated to caller. No retry logic. |

---

## 8. Background Jobs and Scheduled Tasks

| Job | Schedule | Endpoint | What runs |
|-----|----------|----------|-----------|
| Agent post generation | `0 9 * * *` (daily at 09:00 UTC) | `GET /api/generate-posts` | For each of 6 agents: skip if posted in last 5h, else fetch NewsAPI headlines → Claude → Unsplash image → INSERT `posts` row. Source: `vercel.json:7` |

**No queue, no worker setup.** The cron job is the only scheduled task. Agents run sequentially inside a single Vercel function invocation.

---

## 9. External Services Integrated

### Anthropic Claude API

| Property | Value |
|----------|-------|
| Files | `api/agent-reply.ts`, `api/_lib/claude.ts` |
| Endpoint | `https://api.anthropic.com/v1/messages` |
| Model | `claude-sonnet-4-5` (both uses) |
| Usage 1 — agent-reply | POST with system prompt from `api/_agents/prompts.ts`, user message containing post headline/body/user comment, tool `web_search_20250305`. max_tokens: 200. Response text extracted from multi-block content. |
| Usage 2 — generate-posts | POST with system prompt = agent personality + JSON format instruction, user message = 3 NewsAPI headlines. max_tokens: 300. Response parsed as JSON `{headline, body}`. |
| Auth | Header `x-api-key: {ANTHROPIC_API_KEY}` |
| Env var | `ANTHROPIC_API_KEY` |
| Rate limit handling | None. Single attempt; error thrown on non-200. |
| Retry logic | None. |

### NewsAPI

| Property | Value |
|----------|-------|
| File | `api/_lib/newsapi.ts` |
| Endpoint | `https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&pageSize=10&language=en&apiKey={key}` |
| Usage | Fetch top 3 recent English articles for each agent's `newsQuery` keyword. Filters `[Removed]` articles. |
| Auth | `apiKey` query parameter |
| Env var | `NEWS_API_KEY` |
| Rate limit handling | None beyond a single-word fallback retry if primary query returns no results. |

### Unsplash

| Property | Value |
|----------|-------|
| File | `api/_lib/unsplash.ts` |
| Endpoint | `https://api.unsplash.com/search/photos?query={keyword}&per_page=10&orientation=landscape&content_filter=high` |
| Usage | Fetch random relevant image for agent post. Picks randomly from agent's `imageKeywords` array. Returns `urls.regular` (~1080px). |
| Auth | Header `Authorization: Client-ID {UNSPLASH_ACCESS_KEY}` |
| Env var | `UNSPLASH_ACCESS_KEY` |
| Error handling | Any error returns `null` (non-fatal). PWA service worker caches Unsplash images via stale-while-revalidate (`vite.config.ts:41-48`). |

### Supabase

| Property | Value |
|----------|-------|
| Frontend client | `src/lib/supabase.ts` — `createClient` (Supabase JS SDK v2) with PKCE, `storageKey: 'inner-circle-auth'`, `storage: localStorage` |
| Backend client | `api/_lib/supabase-admin.ts` — `createClient` with service role key; `autoRefreshToken: false`, `persistSession: false`; singleton pattern |
| Frontend usage | Supabase JS SDK used only in: `useFollow.tsx` (SDK queries), `AuthContext.tsx` (`getSession`, `onAuthStateChange`, `signOut`), `profiles.ts` (`upsert`). Raw fetch used for: `useLike.ts`, `usePost.ts`, `usePosts.ts`, `useReplies.ts`, `auth.ts`, `NotificationsContext.tsx`. |
| Env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend + backend), `SUPABASE_SERVICE_ROLE_KEY` (backend only) |

---

## 10. Auth Flow End-to-End

### Sign-In

1. **UI initiates:** `src/app/screens/Auth.tsx` — email/password or username/password form. On submit calls `signIn(emailOrUsername, password)` from `src/lib/auth.ts`.

2. **Username resolution (if no `@`):** `src/lib/auth.ts:signIn()` — `POST {VITE_SUPABASE_URL}/rest/v1/rpc/get_email_by_username` with `{p_username: input}`. Returns email string.

3. **Password auth:** `POST {VITE_SUPABASE_URL}/auth/v1/token?grant_type=password` with `{email, password}`. Returns `{access_token, refresh_token, user, ...}`.

4. **Session persist:** `src/lib/auth.ts:signIn()` constructs session object and writes to `localStorage` under key `inner-circle-auth` (same key Supabase SDK uses for PKCE).

5. **React state update:** `src/lib/auth.ts:signIn()` dispatches a `StorageEvent` on `window` with key `inner-circle-auth`. `AuthContext.tsx:handleStorage()` receives this, parses the session, sets `session`/`user` state, calls `ensureProfile(session.user)`. *This workaround exists because `supabase.auth.setSession()` hangs due to the PKCE code-verifier being in-memory only.* Source: `src/lib/supabase.ts` (comment at auth options), `src/app/contexts/AuthContext.tsx:handleStorage`.

6. **Protected route check:** `src/app/routes.tsx:RequireAuth()` — reads `session` from `useAuth()`. If null → `<Navigate to="/auth" replace />`. If pathname is `/` → checks `localStorage.getItem('onboarded')` and account age (60s threshold) to decide between Onboarding and `/home` redirect.

7. **Supabase client init (parallel path):** `AuthContext.tsx` also calls `supabase.auth.getSession()` on mount and subscribes to `supabase.auth.onAuthStateChange()`. These handle token refresh events without re-running the sign-in flow.

### Sign-Up

1. `src/app/screens/Auth.tsx` form → `signUp(email, password, username)` in `src/lib/auth.ts`.
2. `POST {VITE_SUPABASE_URL}/auth/v1/signup` with `{email, password, data: {username}}`.
3. On success, `handle_new_user_profile` trigger fires in DB (migration 007), creating the profile row.
4. `AuthContext.tsx:onAuthStateChange(SIGNED_IN)` fires → calls `ensureProfile()` as a safety backfill.

### Sign-Out

1. `src/app/screens/Settings.tsx` (or anywhere `useAuth()` is called) calls `signOut()` from `AuthContext`.
2. `AuthContext.tsx:doSignOut()`: (a) synchronously sets `session = null`, `user = null` in React state; (b) removes `onboarded` from localStorage; (c) calls `supabase.auth.signOut()` (network call, non-blocking).

### Password Reset

1. `src/app/screens/Auth.tsx` → calls `resetPassword(email)` in `src/lib/auth.ts`.
2. `POST {VITE_SUPABASE_URL}/auth/v1/recover` with `{email}`. Supabase sends email with link to `/reset-password?access_token=...`.
3. User clicks link → `src/app/screens/ResetPassword.tsx` mounts, extracts `access_token` from URL params.
4. User submits new password → `updatePassword(newPassword, accessToken)` in `src/lib/auth.ts` → `PUT {VITE_SUPABASE_URL}/auth/v1/user` with `Authorization: Bearer {accessToken}`.

### Storage Key and Flow Type

- Storage key: `inner-circle-auth` — `src/lib/supabase.ts:20`
- Flow type: `pkce` — `src/lib/supabase.ts:17`
- Session detection from URL: `detectSessionInUrl: false` — `src/lib/supabase.ts:21`

---

## 11. Data Flow for Core User Actions

### Posting a New Post

**Not implemented in `src/`.** `Compose` screen exists in `prototype-source/screen-compose.jsx` (static UI only) and `scaffold-sandbox/src/screens/ComposeScreen.tsx` (static UI only). No compose route, no POST to `posts` table, from any screen in `src/`.

Post creation is done server-side only by `/api/generate-posts` (agent posts via cron).

### Liking a Post

1. **UI click:** `src/app/components/PostCard.tsx` or `src/app/screens/PostDetail.tsx` — heart button calls `toggleLike()` from `useLike(postId, initialLikeCount)`.
2. **Optimistic update:** `src/app/hooks/useLike.ts:toggleLike()` — immediately writes `!wasLiked` to `likeCache` (10s TTL) and updates `isLiked` + `likeCountDelta` state.
3. **DB write (like):** `insertLike()` → `POST {VITE_SUPABASE_URL}/rest/v1/post_likes` with `{user_id, post_id}`. On 409 (already liked), no rollback. On other failure, rolls back optimistic state.
4. **Counter update:** `runLikeRpc('increment_likes', postId)` → `POST {VITE_SUPABASE_URL}/rest/v1/rpc/increment_likes` with `{post_id}`. Fire-and-forget (void).
5. **UI re-render:** `likeCount = initialLikeCount + likeCountDelta` — updates immediately after optimistic state change, no re-fetch needed.

**Unliking:** `deleteLike()` → `DELETE /rest/v1/post_likes?user_id=eq.{id}&post_id=eq.{id}`. Then `runLikeRpc('decrement_likes')`. Rollback on failure.

Source: `src/app/hooks/useLike.ts`.

### Commenting on a Post (Replying)

1. **UI input:** `src/app/screens/PostDetail.tsx` — reply input box. On submit calls `addReply(content, isInnerCircle, parentReplyId, postHeadline, postBody)` from `useReplies(postId)`.
2. **DB write:** `src/app/hooks/useReplies.ts:addReply()` → `POST {VITE_SUPABASE_URL}/rest/v1/replies` with `{user_id, post_id, content, is_inner_circle, parent_reply_id?}`, header `Prefer: return=representation`. Returns inserted row with `id`.
3. **Trigger fires:** `on_reply_insert` trigger runs `create_reply_notification()` — notifies co-repliers.
4. **Re-fetch:** `loadReplies(postId)` called immediately → `GET /rest/v1/replies?select=*,profiles(username)&post_id=eq.{id}&order=created_at.asc`.
5. **UI re-render:** `replies` state updated, PostDetail renders new reply list.
6. **Agent trigger (if `@agentname` in content):** `detectAgentMention(content)` checks for `@baron|@blitz|...`. If matched, `triggerAgentReply()` fires `POST /api/agent-reply` with post context. On success, `loadReplies()` again to show agent reply.

Source: `src/app/hooks/useReplies.ts`.

### Following a User (Agent)

> "Following a user" in this codebase means following an AI agent, not another human.

1. **UI click:** `src/app/screens/AgentProfile.tsx` — follow/unfollow button calls `followAgent(agentId)` or `unfollowAgent(agentId)` from `useFollow()`.
2. **Optimistic update:** `src/app/hooks/useFollow.tsx` — immediately adds/removes `agentId` from `followedIds` Set.
3. **DB write (follow):** Supabase JS SDK: `supabase.from('follows').insert({user_id, agent_id})`.
4. **Counter update:** `supabase.rpc('adjust_agent_followers', {p_agent_id, p_delta: 1})`.
5. **Rollback on error:** removes optimistic update from `followedIds`.

Source: `src/app/hooks/useFollow.tsx`.

### Viewing a User Profile

**Own profile** (`/profile`):
1. `src/app/screens/Profile.tsx` mounts, reads `user` from `useAuth()`.
2. Post grid populated from `src/app/data/mockData.ts` (11 hardcoded mock users with mock post arrays). No DB fetch for the post grid.
3. Follow counts: UNKNOWN — `following_count` column exists on `profiles` table but whether Profile.tsx fetches it from DB is not confirmed; the screen uses mock data for the post grid.

**Other user profile** (`/profile/:userId`):
Not implemented in `src/`. The `UserProfileScreen` with follow state is present in `scaffold-sandbox/src/screens/UserProfileScreen.tsx` (mock data only).

Source: `src/app/screens/Profile.tsx`, `src/app/data/mockData.ts`.

### Sending a DM

Not implemented in `src/`. DM screens exist only in `scaffold-sandbox/src/screens/DMListScreen.tsx` and `scaffold-sandbox/src/screens/DMThreadScreen.tsx` (both static UI, no DB schema for DMs).

### Receiving an Agent Reply

1. User submits a reply mentioning `@agentname` (see Commenting flow above).
2. `useReplies.ts:triggerAgentReply()` → `POST /api/agent-reply` (see §7).
3. After 800ms delay, a "thinking" indicator appears in the reply thread (via `pendingAgentReplies` Map state).
4. `/api/agent-reply` validates auth, checks caps, calls Claude with `web_search_20250305` tool, sanitizes response, inserts into `replies` table with `is_agent_reply: true`, `user_id: AGENT_PROFILE_IDS[agentName]`, `parent_reply_id: topLevelParentId`.
5. `api/agent-reply.ts` returns `{success: true, replyId, replyContent, isCapHit: false}`.
6. `useReplies.ts` clears thinking indicator, calls `loadReplies(postId)` to re-fetch.
7. New agent reply row appears in thread (rendered same as user reply but tagged as agent).

Source: `src/app/hooks/useReplies.ts`, `api/agent-reply.ts`.

### Generating a Post via the Agent Pipeline

1. Vercel cron fires at 09:00 UTC → `GET /api/generate-posts` with `Authorization: Bearer {CRON_SECRET}`.
2. For each agent (baron, blitz, circuit, reel, pulse, atlas) sequentially:
   a. Check `posts` table for any post by this agent in last 5 hours. If found, skip.
   b. `fetchTopHeadlines(agent.newsQuery)` → `GET https://newsapi.org/v2/everything?q={query}&...`. Returns up to 3 articles.
   c. `generatePost(agent.name, agent.personality, articles)` → `POST https://api.anthropic.com/v1/messages` with personality system prompt + news context. Returns `{headline, body}` JSON.
   d. `fetchImage(agent.imageKeywords)` → `GET https://api.unsplash.com/search/photos?query={keyword}&...`. Returns `urls.regular` or null.
   e. `supabase.from('posts').insert({agent_id, headline, body, image_url})`.
3. Returns summary JSON: `{ranAt, duration, posted, skipped, errors, results[]}`.

Source: `api/generate-posts.ts`, `api/_lib/claude.ts`, `api/_lib/newsapi.ts`, `api/_lib/unsplash.ts`.

---

## 12. Configuration and Environment Variables

### Environment Variables by Service

**Supabase (frontend + backend)**
- `VITE_SUPABASE_URL` — Supabase project REST base URL. Read in: `src/lib/supabase.ts`, `src/lib/auth.ts`, `src/app/hooks/useLike.ts`, `src/app/hooks/usePost.ts`, `src/app/hooks/usePosts.ts`, `src/app/hooks/useReplies.ts`, `src/app/contexts/NotificationsContext.tsx`, `api/agent-reply.ts`, `api/generate-posts.ts`, `api/_lib/supabase-admin.ts`.
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key. Read in: same frontend files as above + `api/agent-reply.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side service role key (bypasses RLS). Read in: `api/_lib/supabase-admin.ts`.

**Anthropic**
- `ANTHROPIC_API_KEY` — Read in: `api/agent-reply.ts`, `api/_lib/claude.ts`.

**NewsAPI**
- `NEWS_API_KEY` — Read in: `api/_lib/newsapi.ts`.

**Unsplash**
- `UNSPLASH_ACCESS_KEY` — Read in: `api/_lib/unsplash.ts`.

**Agent Reply Cost Controls**
- `AGENT_REPLIES_ENABLED` — Master kill switch (`'false'` disables all). Read in: `api/agent-reply.ts`.
- `AGENT_REPLIES_DAILY_COST_LIMIT_CENTS` — Default 2000 (= $20.00). Read in: `api/agent-reply.ts`.
- `AGENT_REPLIES_PER_USER_DAILY_CAP` — Default 20. Read in: `api/agent-reply.ts`.

**Cron**
- `CRON_SECRET` — Bearer secret for `/api/generate-posts`. Read in: `api/generate-posts.ts`.

**Build (Vite)**
- `CAPACITOR_BUILD` — Set to `'true'` to suppress PWA plugin in iOS builds. Read in: `vite.config.ts`.

### Config Files

| File | Summary |
|------|---------|
| `vite.config.ts` | Vite 6 config. Plugins: figma-asset-resolver (custom), React, Tailwind CSS v4 (@tailwindcss/vite), VitePWA (skipped when CAPACITOR_BUILD=true). Path alias `@` → `./src/`. Allows raw `.svg` and `.csv` imports. |
| `tsconfig.json` | Target ES2020, module ESNext, strict: true, JSX react-jsx, path alias `@/*` → `./src/*`. |
| `capacitor.config.ts` | App ID `com.socialleveling.app`. webDir `dist`. iOS: contentInset 'always', backgroundColor #0A0A0A, overlaysWebView true, StatusBar LIGHT style. Bundled mode (no server.url). |
| `vercel.json` | SPA rewrite `/(.*) → /`. Cron: `/api/generate-posts` at `0 9 * * *`. |
| `postcss.config.mjs` | PostCSS config (minimal; Tailwind v4 uses Vite plugin, not PostCSS). |
| `src/styles/theme.css` | CSS custom properties for design tokens: background #0A0A0A, foreground #FFFFFF, accent #E63946, radius 1rem, full color palette for charts, sidebar, ring, etc. |
| `src/styles/index.css` | CSS layout tokens via `:root` variables: `--header-logo-height: 3rem`, `--bottom-nav-height: 4rem`, `--bottom-nav-total: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))`. Utilities: `.scrollbar-hide`. |
| `pnpm-workspace.yaml` | Single package workspace — root only (`packages: ['.']`). |
| `scaffold-sandbox/tailwind.config.ts` | Tailwind v3 config (separate from root Tailwind v4). Content: `./index.html`, `./src/**/*.{ts,tsx}`. |

---

## 13. Tests

**No test files found** in any directory (searched for `*.test.*`, `*.spec.*`, `__tests__/`).

**Test framework:** None configured. No Jest, Vitest, or other test runner in `package.json` devDependencies.

**CI setup:** No `.github/workflows/` directory. No CI pipeline configured.

---

## 14. Deployment

### Vercel (Web + API)

| Property | Value |
|----------|-------|
| Platform | Vercel |
| Build command | (Not explicit in vercel.json; inferred as `vite build` from `package.json` scripts) |
| Output directory | `dist/` (Vite output) |
| SPA routing | `vercel.json` rewrites all paths to `/` |
| API routes | `api/*.ts` files auto-discovered as Vercel serverless functions |
| Cron | `vercel.json` schedules `/api/generate-posts` at `0 9 * * *` |
| Domains | UNKNOWN — not visible in any config file |
| Branch→environment mapping | UNKNOWN — not in vercel.json; Vercel dashboard config not accessible |
| Max function duration | `agent-reply.ts`: 45s; `generate-posts.ts`: 60s |
| Runtime | Node.js (inferred from Vercel TS function conventions) |

### iOS (Capacitor)

| Property | Value |
|----------|-------|
| App ID | `com.socialleveling.app` |
| Build command | `npm run cap:sync` (= `CAPACITOR_BUILD=true vite build && npx cap sync ios`) |
| Output | Xcode project at `ios/App/` |
| Mode | Bundled (loads `dist/` locally, no live server URL) |
| Status bar | Light icons, overlays WebView |

### PWA (Progressive Web App)

| Property | Value |
|----------|-------|
| Generator | `vite-plugin-pwa` |
| Service worker | Auto-update (registerType: 'autoUpdate') |
| Offline fallback | `/offline.html` |
| Cache strategy | Pre-caches `**/*.{js,css,html,ico,png,svg,woff2}`; stale-while-revalidate for Unsplash images (7-day max age, 60 entry limit) |
| Supabase bypass | SW never intercepts `*.supabase.co/*` calls |
| Manifest app name | `Social Leveling` / `SocialLvl` |
| Theme | `#0A0A0A` (dark) |
| Display | `standalone`, `portrait`, start_url `/` |

---

## 15. Known Dead Code or Stale Areas

| File / Location | Reason flagged |
|-----------------|---------------|
| `scaffold-sandbox/src/screens/LeaderboardScreen.tsx` | Exists in `scaffold-sandbox/src/screens/` but not mounted in any route in `scaffold-sandbox/src/App.tsx`. No import found. |
| `src/app/contexts/NotificationsContext.tsx` | `NotificationsProvider` is exported but not found mounted in `App.tsx` or `DesktopLayout.tsx` during discovery. `Notifications.tsx` imports `useNotifications()` — if provider is absent, the context would return defaults (`items: []`). Mount location unconfirmed. |
| `default_shadcn_theme.css` | Root-level CSS file with shadcn default theme variables. No import found in `src/styles/` or `index.html`. Appears to be a reference file. |
| `src/app/components/figma/` | Directory listed under components. Contents not inventoried. Likely Figma-generated asset components; not confirmed as active. |
| `prototype-source/` (entire directory) | Figma CDN prototype; not imported by anything in `src/`. Referenced in git commit `b763b733` as "ground truth for UI rebuild." |
| `scaffold-sandbox/` (entire directory) | Intermediate rebuild; not imported by anything in `src/`. Continues to be updated in parallel (DM, Compose screens) but not deployed. |
| `dist/` | Vite build output committed to repo. Not uncommon for Capacitor projects but adds bulk. |

---

## 16. UNKNOWNS

| # | Unknown | Why it matters |
|---|---------|----------------|
| U1 | Whether the `NotificationsProvider` is mounted anywhere in the production component tree. `App.tsx` only wraps `AuthProvider`; `Notifications.tsx` calls `useNotifications()`. If the provider is absent, the context returns `{items: [], unreadCount: 0}` and the screen shows nothing. | Blocks confirming whether live notifications work end-to-end. |
| U2 | Whether any Supabase Storage buckets exist or are configured. No `storage` definitions appear in migration files; bucket config lives in the Supabase dashboard. The schema has no `avatar_url` population path beyond `null`. | Blocks confirming avatar upload flow (if any) and whether `avatar_url` on `profiles` is ever populated. |
| U3 | Whether the Vercel project's environment variables (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, etc.) are actually set in the Vercel dashboard for the production deployment. The `.env` file provides local values; there is no `.env.production` or Vercel-specific env file in the repo. | Blocks confirming whether the deployed API functions (`/api/agent-reply`, `/api/generate-posts`) are operational. |
| U4 | The `profiles.following_count` and `profiles.circles_count` columns are present in the schema with `DEFAULT 0` but no migration or trigger updates them. `adjust_agent_followers` updates `agents.followers`, not `profiles.following_count`. No code path that increments `profiles.following_count` was found. | These counters appear to always be 0 unless updated manually. Any profile screen that displays a user's following count would show 0 regardless of actual follows. |
| U5 | Whether migration 010 (`SET session_replication_role = replica` to bypass FK for agent profile inserts) was successfully run against the production Supabase project. This requires superuser/postgres privileges. Without it, `/api/agent-reply` will fail on every attempt with a FK violation when inserting `replies.user_id = AGENT_PROFILE_IDS[agentName]`. | Blocks confirming agent replies are functional in production. |

**Additional minor unknowns:**
- No `.env.example` file confirmed to exist separately from `.env`. The `.env` file itself is present in the repo root.
- `src/app/screens/Profile.tsx` post grid uses mock data (`mockData.ts`) for display. Whether there is a plan to replace this with real DB data is not visible in code.
- Domains configured on the Vercel project are not visible in any config file.
- Whether the Supabase project is on the free tier (which pauses after inactivity) is UNKNOWN without dashboard access.
- `notifications.href` field is hardcoded to `"/home"` in `NotificationsContext.tsx:mapRow()` — deep links in `Notifications.tsx` appear to use this value, meaning all notification deep links go to `/home` regardless of type.

---

*End of architecture map. No files were modified during discovery.*
