# REBUILD PLAN: scaffold-sandbox → production src/

**Branch:** `rebuild`
**Date authored:** 2026-04-25
**Supabase project:** `xjhwepzhqfmyiabisvqb`
**Status:** Plan only. No code has been changed.

---

## 1. Pre-conditions to verify

Before executing any step, confirm every item below is true.

### Repo / branch
- [ ] Currently on branch `rebuild` (not `main`). `git branch --show-current` → `rebuild`.
- [ ] `rebuild` is NOT ahead of `main` in any way that would be clobbered. Run `git log main..rebuild` to confirm only the scaffold/profile work is there.
- [ ] Working tree is clean (`git status` shows no uncommitted changes before the swap starts).

### Vercel project
- [ ] Vercel project is connected to this repo and set to deploy from the `rebuild` branch (or preview deploys are enabled for `rebuild`).
- [ ] Vercel → Settings → Environment Variables contains all seven vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `ANTHROPIC_API_KEY`
  - `UNSPLASH_ACCESS_KEY`
  - `NEWS_API_KEY`
  - `CRON_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Vercel build command is `vite build` (or equivalent) and output directory is `dist`. Confirm in Vercel → Settings → Build & Development Settings.
- [ ] The cron at `0 9 * * *` → `/api/generate-posts` is visible in Vercel → Cron Jobs. It will survive a `src/` rewrite because it is wired to `/api/generate-posts`, which is not changing.

### Supabase
- [ ] Migrations 012–015 are applied. Verify in Supabase Dashboard → SQL Editor:
  ```sql
  SELECT name FROM supabase_migrations.schema_migrations ORDER BY name;
  ```
  Expected to include `012_profile_wireup_schema`, `013_profile_wireup_triggers`, `014_post_images_storage`, `015_user_posts_constraints`.
- [ ] Storage bucket `post-images` exists (created in migration 014). Verify in Supabase Dashboard → Storage.
- [ ] RLS is enabled on: `profiles`, `posts`, `replies`, `likes`, `user_follows`, `notifications`. Verify in Dashboard → Auth → Policies.
- [ ] `get_email_by_username` RPC exists (migration 003). Needed by `src/lib/auth.ts:signIn`.
- [ ] The `notifications` table exists (migration 008) with at least the columns: `id`, `user_id`, `type`, `read`, `created_at`.

### iOS / Capacitor
- [ ] CocoaPods is installed (`pod --version`).
- [ ] Xcode 15+ is installed.
- [ ] `ios/App/App/public/` exists and contains a previous build (or at least the `index.html` stub from `cap sync`).
- [ ] The iOS scheme `App` opens in Xcode without errors before the swap.

### Node / pnpm
- [ ] `pnpm --version` ≥ 8.x (the root `pnpm-workspace.yaml` implies pnpm).
- [ ] `node --version` is 20+ (required by Vite 6).
- [ ] Root `node_modules/` is fully installed (`pnpm install` runs clean).

### Local env
- [ ] A `.env` file exists at repo root with all `VITE_*` values set (needed for local dev after the swap).

---

## 2. What gets deleted

### The entire `src/` tree

Every file under `src/` is deleted. The complete list:

```
src/
├── main.tsx
├── vite-env.d.ts
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── NotificationsContext.tsx
│   ├── screens/
│   │   ├── Auth.tsx
│   │   ├── Compose.tsx
│   │   ├── Explore.tsx
│   │   ├── Home.tsx
│   │   ├── AgentFeed.tsx
│   │   ├── AgentProfile.tsx
│   │   ├── ImageEdit.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Notifications.tsx
│   │   ├── Onboarding.tsx
│   │   ├── PostDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── ResetPassword.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useCreatePost.ts
│   │   ├── useFollow.tsx
│   │   ├── useLike.ts
│   │   ├── usePost.ts
│   │   ├── usePosts.ts
│   │   ├── useProfile.ts
│   │   └── useReplies.ts
│   ├── data/
│   │   ├── mockData.ts
│   │   └── notificationsData.ts
│   ├── lib/
│   │   └── agents.ts
│   └── components/
│       ├── BottomNav.tsx
│       ├── DesktopLayout.tsx
│       ├── PageShell.tsx
│       ├── PostCard.tsx
│       ├── PostImage.tsx
│       ├── MentionPicker.tsx
│       ├── AppErrorBoundary.tsx
│       ├── ErrorBoundary.tsx
│       ├── AgentDots.tsx
│       ├── layout-constants.ts
│       ├── figma/
│       │   └── ImageWithFallback.tsx
│       └── ui/  (55 shadcn/Radix component files)
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── profiles.ts
│   └── database.types.ts
└── styles/
    ├── index.css
    ├── fonts.css
    ├── tailwind.css
    └── theme.css
```

### Root-level files that exist ONLY to support the current `src/`

| File | Reason to delete |
|------|-----------------|
| `default_shadcn_theme.css` | Documents the shadcn color theme used by `src/components/ui/`. scaffold-sandbox has no shadcn/ui. |

### Root-level files that will be **replaced** (not deleted — they are overwritten as part of Section 6)

`vite.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `package.json` are not deleted; they are updated in-place as described in Section 6.

---

## 3. What gets kept

Every path below survives the swap **unchanged**:

| Path | Contents |
|------|----------|
| `/api/` | All 15 serverless function files: `agent-reply.ts`, `generate-posts.ts`, `_agents/` (6 agents + constants + types + prompts), `_lib/` (claude.ts, newsapi.ts, supabase-admin.ts, unsplash.ts) |
| `/supabase/migrations/` | All 15 `.sql` files (001–015) |
| `/supabase/KILL_SWITCH.md` | Kill-switch documentation for migration 013 triggers |
| `/ios/` | Entire Capacitor iOS wrapper (Xcode project, Pods, xcconfig, capacitor-cordova-ios-plugins) |
| `/public/` | `offline.html`, `apple-touch-icon.png`, `icon-192x192.png`, `icon-512x512.png` — all PWA assets |
| `/scripts/` | `generate-icons.mjs` (icon generation script) |
| `capacitor.config.ts` | iOS config (appId, webDir, StatusBar plugin). **Unchanged.** |
| `vercel.json` | Rewrites + cron job. **Unchanged.** |
| `pnpm-workspace.yaml` | Single-package workspace declaration. **Unchanged.** |
| `.env.example` | Seven env var template. **Unchanged.** |
| `.gitignore` | Unchanged. |
| `index.html` | Unchanged (PWA meta tags, viewport-fit=cover, `<div id="root">`). The `<script src="/src/main.tsx">` reference remains valid because scaffold-sandbox's `main.tsx` moves to the same path. |
| `ARCHITECTURE_MAP.md` | Reference documentation. Keep. |
| `ATTRIBUTIONS.md` | License attributions. Keep. |
| `README.md` | Keep. |

---

## 4. What gets moved or restructured

### The move operation

The core operation is:

```
Move: scaffold-sandbox/src/*  →  src/
```

That means every file inside `scaffold-sandbox/src/` (recursively) moves to the same relative path under `src/`. After the move, `src/` contains:

```
src/
├── App.tsx                        (was scaffold-sandbox/src/App.tsx)
├── main.tsx                       (was scaffold-sandbox/src/main.tsx)
├── screens/                       (18 screen files — see Section 10 for route gaps)
├── components/                    (Comment.tsx, CommentsSection.tsx, Logo.tsx, primitives.tsx, states.tsx)
├── layouts/                       (DesktopLayout.tsx, MobileLayout.tsx)
├── lib/                           (design-tokens.ts, dm-preferences.ts, follow-preferences.ts,
│                                   leaderboard-mock.ts, mock-data.ts, types.ts,
│                                   useAsync.ts, useIsDesktop.ts)
└── styles/
    └── globals.css
```

The `scaffold-sandbox/` directory itself **remains in the repo** until the swap is verified working. Once the rebuild branch is green, `scaffold-sandbox/` can be removed in a cleanup commit.

### Config files in `scaffold-sandbox/` that inform (but don't move to) root

| scaffold-sandbox file | Disposition |
|----------------------|-------------|
| `scaffold-sandbox/package.json` | **Reference only.** Its deps feed the dependency delta in Section 5. Does not replace root `package.json`. |
| `scaffold-sandbox/vite.config.ts` | **Reference only.** Its alias setup (`@` → `./src`) is already in root `vite.config.ts`. |
| `scaffold-sandbox/tailwind.config.ts` | **Its token values must be merged into root config.** See Section 6. |
| `scaffold-sandbox/postcss.config.js` | **Reference only.** Tailwind v3 PostCSS pipeline; root uses Tailwind v4 via `@tailwindcss/vite`. See Section 6 for the resolution. |
| `scaffold-sandbox/tsconfig.json` | **Reference only.** Root tsconfig is updated (see Section 6), not replaced. |

### Path changes that propagate from the move

| Setting | Current value | After move | Action needed |
|---------|--------------|------------|---------------|
| `index.html` script src | `/src/main.tsx` | `/src/main.tsx` | **No change.** Same path. |
| `vite.config.ts` alias `@` | `./src` | `./src` | **No change.** |
| `tsconfig.json` paths `@/*` | `./src/*` | `./src/*` | **No change.** |
| `capacitor.config.ts` `webDir` | `dist` | `dist` | **No change.** Vite still outputs to `dist/`. |
| `vercel.json` rewrites | `/(.*) → /` | `/(.*) → /` | **No change.** |
| `scaffold-sandbox/src/main.tsx` BrowserRouter | imports `BrowserRouter` from `react-router-dom` v6 | Must become RouterProvider from `react-router` v7 | **Requires update.** See Section 7 (auth wire-up) and Section 10 (routes). |
| `scaffold-sandbox/src/App.tsx` Routes | `<Routes><Route>` v6 API | Must become `createBrowserRouter` and `RouterProvider` | **Requires update.** See Section 10. |

---

## 5. Dependencies — full delta

### 5.1 Packages in root but NOT in scaffold-sandbox

These exist today. For each: keep, drop, or decision needed.

#### Capacitor (keep — required for iOS)
| Package | Version | Decision |
|---------|---------|----------|
| `@capacitor/cli` | ^7.6.2 | **Keep.** |
| `@capacitor/core` | ^7.6.2 | **Keep.** |
| `@capacitor/ios` | ^7.6.2 | **Keep.** |
| `@capacitor/status-bar` | ^7.0.6 | **Keep.** |

#### Radix UI + shadcn/ui (decision needed — see Section 14)
35 `@radix-ui/react-*` packages, plus `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `input-otp`, `vaul`. scaffold-sandbox uses none of these. **Decision required before execution.**

#### Material UI + Emotion (drop recommendation)
`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`. scaffold-sandbox has no MUI. Unless a specific MUI component is kept for a known use case, **recommend dropping all four.**

#### Form libraries (drop recommendation)
`react-hook-form`. scaffold-sandbox's AuthScreen uses plain controlled state. **Recommend dropping.**

#### Supabase SDK (keep — required for backend wire-up)
`@supabase/supabase-js` ^2.103.2. **Keep.**

#### react-router v7 (keep — see Section 10)
`react-router@7.13.0`. **Keep.** scaffold-sandbox's v6 `react-router-dom` is replaced by this.

#### Utilities the scaffold doesn't use (drop recommendation)
`date-fns`, `recharts`, `embla-carousel-react`, `react-dnd`, `react-dnd-html5-backend`, `react-easy-crop`, `react-responsive-masonry`, `react-slick`, `react-day-picker`, `react-resizable-panels`, `react-popper`, `@popperjs/core`, `canvas-confetti`, `next-themes`, `sonner`, `tw-animate-css`. **Recommendation: drop all** unless a specific screen in scaffold-sandbox requires them. Add back per-screen during wire-up.

#### Exception: lucide-react
`lucide-react@0.487.0`. scaffold-sandbox's design uses CSS + SVG primitives for icons, but some wire-up components may use lucide. **Keep until screen-by-screen audit says otherwise.**

#### Exception: motion
`motion@12.23.24`. scaffold-sandbox already imports `motion@^12.0.0`. **Keep, resolve version in 5.3.**

#### DevDeps to keep
`@tailwindcss/vite@4.1.12`, `vite-plugin-pwa`, `@vite-pwa/assets-generator`, `pngjs`, `@types/node` — all PWA/Capacitor tooling. **Keep.**

---

### 5.2 Packages in scaffold-sandbox but NOT in root

These must be added to root `package.json`:

| Package | Version | Decision |
|---------|---------|----------|
| `@fontsource/inter` | ^5.2.8 | **Decision needed.** scaffold-sandbox loads Inter via @fontsource. Current src/ loads DM Sans, Outfit, Unbounded from Google Fonts. See Section 14 (font stack decision). |
| `@fontsource/geist-sans` | ^5.0.0 | Same decision. |
| `@fontsource/geist-mono` | ^5.0.0 | Same decision. |
| `react` | ^18.3.1 | **Add as explicit dep** (currently a peer/optional dep in root). |
| `react-dom` | ^18.3.1 | **Add as explicit dep.** |
| `postcss` | ^8.4.40 | **Keep in devDeps** if Tailwind v3 is chosen; **drop** if Tailwind v4 wins (v4 has no PostCSS requirement). |
| `autoprefixer` | ^10.4.20 | Same as postcss decision. |
| `react-router-dom` | ^6.26.0 | **Drop.** Root uses `react-router` v7, which is a superset. Do not add v6. |

---

### 5.3 Version conflicts

| Package | Root version | Scaffold version | Resolution |
|---------|-------------|-----------------|------------|
| **tailwindcss** | 4.1.12 | ^3.4.10 | **Critical conflict. See Section 14.** Recommend keeping v4 (root). If v4 wins: drop scaffold's `tailwind.config.ts` approach, port its color tokens into v4 `@theme` block in CSS. If v3 wins: downgrade root, add `postcss` + `autoprefixer` to devDeps, delete `@tailwindcss/vite` from root devDeps. |
| **vite** | 6.3.5 | ^5.4.0 | **Keep v6.** Root's `pnpm.overrides` pins it at 6.3.5. scaffold's build ran on v5 locally but does not require v5-specific APIs. The alias config (`@` → `./src`) is compatible with v6. |
| **@vitejs/plugin-react** | 4.7.0 | ^4.3.0 | **Keep 4.7.0.** Backward-compatible update. |
| **motion** | 12.23.24 | ^12.0.0 | **Keep 12.23.24.** scaffold's `^12.0.0` range already satisfies this. |
| **typescript** | ^5.8.3 | ^5.5.0 | **Keep ^5.8.3.** Stricter but compatible. |
| **@types/react** | 18.3.1 | ^18.3.0 | **Keep 18.3.1.** |
| **@types/react-dom** | 18.3.1 | ^18.3.0 | **Keep 18.3.1.** |

---

## 6. Configuration changes

### 6.1 `vite.config.ts`

**File:** `/vite.config.ts`

What changes:

1. **Keep** the `figmaAssetResolver()` custom plugin (used by scaffold assets if any reference `figma:asset/` imports — verify post-move).
2. **Keep** the `react()` plugin from `@vitejs/plugin-react`.
3. **If Tailwind v4 (recommended):** Keep `tailwindcss()` from `@tailwindcss/vite`. **If Tailwind v3:** remove it, rely on PostCSS pipeline.
4. **Keep** the conditional PWA plugin (only when `CAPACITOR_BUILD !== 'true'`). The PWA config is unchanged.
5. **Keep** `resolve.alias: { '@': './src' }`. scaffold-sandbox already uses this alias.
6. **Keep** `assetsInclude: ['**/*.{svg,csv}']` for raw asset imports.
7. **New:** scaffold-sandbox's `vite.config.ts` adds `path.resolve(__dirname, 'src')` for the alias. Root already does this equivalently. No new change needed.

**Net change to root vite.config.ts: none**, provided Tailwind v4 is kept.

---

### 6.2 `tsconfig.json`

**File:** `/tsconfig.json`

Current root settings vs scaffold-sandbox settings that differ:

| Setting | Root | Scaffold | Action |
|---------|------|----------|--------|
| `target` | `ES2020` | `ES2022` | **Update root to ES2022.** Scaffold was designed for ES2022 class fields (`useDefineForClassFields`). |
| `noUnusedLocals` | not set | `true` | **Add to root** — scaffold TypeScript is stricter. Wire-up code must not leave unused imports. |
| `noUnusedParameters` | not set | `true` | **Add.** |
| `noFallthroughCasesInSwitch` | not set | `true` | **Add.** |
| `skipLibCheck` | not set | `true` | **Add.** Required to skip lib checks in mixed-dep environment. |
| `esModuleInterop` | not set | `true` | **Add.** Required by `@fontsource` imports and potentially by Supabase SDK. |
| `allowSyntheticDefaultImports` | not set | `true` | **Add.** |
| `isolatedModules` | not set | `true` | **Add.** Required for Vite's esbuild transform. |
| `include` | `["src", "vite.config.ts"]` | `["src"]` | **Keep root's include** (include `vite.config.ts` for figmaAssetResolver typing). |
| `exclude` | `["node_modules", "api"]` | not set | **Keep root's exclude** (api/ is compiled separately by Vercel). |

---

### 6.3 Tailwind config

**Conditional on decision in Section 14.**

**Option A — Keep Tailwind v4 (recommended):**

- Delete `scaffold-sandbox/tailwind.config.ts` (it is v3 syntax and does not move to root).
- The root currently has no `tailwind.config.*` file at root level (v4 is configured entirely via CSS `@theme` blocks).
- Action: create `src/styles/tokens.css` (or add to `globals.css`) that defines scaffold's color tokens as Tailwind v4 `@theme inline` variables:
  ```css
  @theme inline {
    --color-bg:    #070707;
    --color-bg-1:  #0D0D0D;
    /* ... agent colors, mute, gold, etc. */
  }
  ```
- The scaffold's Tailwind class names (`bg-bg`, `text-mute`, `bg-agent-baron`, etc.) will then resolve via the v4 theme.
- **Effort:** Medium. Every scaffold Tailwind class name uses the scaffold's token names. These must work via the v4 @theme block.

**Option B — Downgrade to Tailwind v3:**

- Replace `tailwindcss@4.1.12` and `@tailwindcss/vite@4.1.12` in root `package.json` with `tailwindcss@^3.4.10`.
- Add `postcss@^8.4.40` and `autoprefixer@^10.4.20` to devDeps.
- Move `scaffold-sandbox/tailwind.config.ts` → root `tailwind.config.ts`.
- Update `postcss.config.mjs` to export `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`.
- Remove `@tailwindcss/vite` import from `vite.config.ts`.
- Update root `src/styles/globals.css` first line to `@tailwind base; @tailwind components; @tailwind utilities;` (scaffold already has this).
- **Risk:** The current production `main` branch depends on v4 CSS features (`@custom-variant dark`, `@theme inline` in `theme.css`). Since `main` and `rebuild` diverge from here, downgrade only affects `rebuild`.

---

### 6.4 `postcss.config.mjs`

**If Tailwind v4:** Root's empty `postcss.config.mjs` stays empty. No change.

**If Tailwind v3:** Rename to `postcss.config.js` and set:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

---

### 6.5 `capacitor.config.ts`

**No changes required.** `webDir: 'dist'` is correct (Vite still outputs to `dist/`). AppId, appName, iOS contentInset, StatusBar plugin config all remain correct.

---

### 6.6 `vercel.json`

**No changes required.** The rewrite `/(.*) → /` serves the SPA correctly regardless of route structure. The cron at `/api/generate-posts` is unchanged.

---

### 6.7 `package.json`

**Changes:**
1. **Remove** all Radix UI packages (if decision is to drop shadcn — see Section 14).
2. **Remove** `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`.
3. **Remove** `react-hook-form`, `react-dnd`, `react-dnd-html5-backend`, `react-easy-crop`, `react-responsive-masonry`, `react-slick`, `react-day-picker`, `react-resizable-panels`, `react-popper`, `@popperjs/core`, `canvas-confetti`, `next-themes`, `tw-animate-css`, `recharts`, `embla-carousel-react`, `date-fns`, `cmdk`, `input-otp`, `vaul` (unless any scaffold screen requires them — verify per screen).
4. **Add** `react@18.3.1` and `react-dom@18.3.1` as explicit `dependencies` (not peerDeps).
5. **Add** `@fontsource/inter@^5.2.8`, `@fontsource/geist-sans@^5.0.0`, `@fontsource/geist-mono@^5.0.0` **if scaffold's font stack is kept** (see Section 14).
6. **Add** `postcss@^8.4.40` and `autoprefixer@^10.4.20` to devDeps **only if Tailwind v3**.
7. **Keep** `@supabase/supabase-js`, `@capacitor/*`, `motion`, `lucide-react`, `tailwind-merge`, `clsx`, `react-router@7.13.0`, `sonner`, `vite-plugin-pwa`.
8. **Scripts:** No changes to existing scripts needed. The `build`, `dev`, `build:capacitor`, `cap:sync`, `cap:open` scripts all remain valid.

---

### 6.8 `pnpm-workspace.yaml`

**No changes.** Single package at `.`.

---

### 6.9 `.env` / `.env.example`

**No changes.** All seven env vars are unchanged. The new `src/` uses the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as the old `src/`.

---

### 6.10 `.gitignore`

**No changes.** Already ignores `node_modules`, `dist`, `.env`, iOS artifacts.

---

### 6.11 `index.html`

**No changes.** The `<script type="module" src="/src/main.tsx">` path is preserved because scaffold-sandbox's `main.tsx` moves to `src/main.tsx`. All PWA meta tags, viewport-fit, and theme-color remain.

---

## 7. Backend wire-up — what needs to be added to scaffold-sandbox

This is the largest section. scaffold-sandbox currently uses only mock data. Every piece below must be ported into the new `src/` before any screen is functional.

---

### 7.1 Supabase client

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| Supabase client | `src/lib/supabase.ts` (72 lines) | `src/lib/supabase.ts` (new file, same path) | None. Drop it in as-is. Uses `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, PKCE flow, `storageKey: 'inner-circle-auth'`. |
| Database types | `src/lib/database.types.ts` | `src/lib/database.types.ts` | None. Generated Supabase types. Drop in as-is. |
| Auth functions | `src/lib/auth.ts` (169 lines) | `src/lib/auth.ts` | None. Contains `signIn` (with PKCE StorageEvent workaround), `signUp`, `signOut`, `resetPassword`, `updatePassword`, `getCurrentUser`. Drop in as-is. |
| Profile helpers | `src/lib/profiles.ts` (23 lines) | `src/lib/profiles.ts` | None. Contains `ensureProfile` (upsert on login) and `getProfileUsername`. Drop in as-is. |

All four files move to the same relative path. No import path changes needed.

---

### 7.2 AuthContext with StorageEvent workaround

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| AuthContext | `src/app/contexts/AuthContext.tsx` (144 lines) | `src/contexts/AuthContext.tsx` | Path changes: update imports from `../lib/supabase` → `../lib/supabase`, and `../lib/profiles` → `../lib/profiles` (relative paths will resolve correctly if placed in `src/contexts/`). |
| AuthProvider mount point | `src/app/App.tsx` wraps RouterProvider in `<AuthProvider>` | `src/App.tsx` must wrap RouterProvider in `<AuthProvider>` | **Requires change to scaffold's App.tsx.** Add `import { AuthProvider } from './contexts/AuthContext'` and wrap the `<Shell>` + `<Routes>` tree. |
| useAuth hook | Exported from `src/app/contexts/AuthContext.tsx` | Same file | No change. |

**Critical:** The StorageEvent workaround in `AuthContext.tsx` (lines 72–96) listens for `window.storage` events on key `inner-circle-auth`. This is what allows `signIn` (in `auth.ts`) to notify React state without calling `supabase.auth.setSession()` (which hangs under PKCE). This pattern must be preserved exactly. Do not replace with a direct `supabase.auth.setSession()` call.

---

### 7.3 Auth screens

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| Auth screen logic | `src/app/screens/Auth.tsx` | Port into `src/screens/AuthScreen.tsx` | scaffold's `AuthScreen.tsx` is pure UI with mock handlers. Replace mock `handleLogin`, `handleSignUp` calls with `signIn(email, password)` and `signUp(email, password, username)` from `src/lib/auth.ts`. Add navigation after success (`useNavigate` from react-router). |
| Reset password | `src/app/screens/ResetPassword.tsx` | Port into `src/screens/PlaceholderScreen.tsx` → replace with real screen | scaffold has `PlaceholderScreen` at `/reset-password`. Port `ResetPassword.tsx` logic: reads `access_token` from URL hash, calls `updatePassword(newPassword, accessToken)` from `auth.ts`. |
| Onboarding | `src/app/screens/Onboarding.tsx` | Port into `src/screens/OnboardingScreen.tsx` | scaffold's OnboardingScreen is a full UI scaffold. Port username-setting and `localStorage.setItem('onboarded', 'true')` logic from current `Onboarding.tsx`. |

---

### 7.4 RequireAuth wrapper

scaffold-sandbox has **no auth guard**. The `src/app/routes.tsx` `RequireAuth` component (lines 10–36) handles:
- Redirect to `/auth` if no session
- Onboarding routing logic (checks `localStorage.getItem('onboarded')` and account age)

This component must be recreated in the new `src/App.tsx` or a new `src/lib/RequireAuth.tsx` file. It wraps all protected routes. Since scaffold uses the v6-style `<Routes>/<Route>` API (which will be migrated to v7 `createBrowserRouter`), `RequireAuth` becomes a `loader` or a wrapper component in the new router — port the same logic.

---

### 7.5 Profile data fetching

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| useProfile hook | `src/app/hooks/useProfile.ts` (212 lines) | `src/hooks/useProfile.ts` | Update import path: `../../lib/supabase` → `../lib/supabase`. |
| ProfileScreen wiring | `src/app/screens/Profile.tsx` | Wire into `src/screens/ProfileScreen.tsx` | scaffold's ProfileScreen uses `mock-data.ts` for user info and post grid. Replace with `useProfile(user.id)` call. Pass `profile`, `userPosts`, `agentFollowingCount` to the scaffold UI components. The scaffold's ProfileScreen needs to import `useAuth` to get `user.id` and `useProfile` for the data. Its JSX structure should survive; only the data source changes. |
| UserProfileScreen | No equivalent hook; Profile.tsx handles own user only | `src/screens/UserProfileScreen.tsx` | scaffold's UserProfileScreen is a separate component for viewing other users' profiles. Requires a `useUserProfile(handle: string)` hook (UNKNOWN — see Section 12). May need to be authored as a net-new hook or the existing `useProfile` adapted to accept a userId or handle. |

---

### 7.6 Compose / posting flow

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| useCreatePost hook | `src/app/hooks/useCreatePost.ts` (130 lines) | `src/hooks/useCreatePost.ts` | Update import: `../../lib/supabase` → `../lib/supabase`. |
| ComposeScreen wiring | `src/app/screens/Compose.tsx` | Wire into `src/screens/ComposeScreen.tsx` | scaffold's ComposeScreen currently has mock submit. Replace submit handler with `createPost({ body, agent_id, image })` from `useCreatePost`. The scaffold ComposeScreen needs to accept `useAuth` for session, `useCreatePost` for submission, and `useNavigate` to redirect after success. Agent selector in scaffold must map to real agent IDs (from `api/_agents/constants.ts`: `AGENT_PROFILE_IDS`). |

---

### 7.7 Image upload to Supabase Storage

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| Image upload logic | Inside `src/app/hooks/useCreatePost.ts` (lines 40–68) | Travels with `useCreatePost.ts` as-is | No separate file needed. Upload logic is embedded in `useCreatePost`. Uses bucket `post-images`, path `{user_id}/{post_id}.jpg`. The scaffold ComposeScreen's image picker/preview UI just needs to pass a `Blob` to `createPost({ image: blob })`. |
| ImageEdit screen | `src/app/screens/ImageEdit.tsx` | New: `src/screens/ImageEditScreen.tsx` | scaffold has no ImageEdit screen. The route `/image-edit` is currently in current src/. See Section 10 for route gap details. This may need to be a net-new screen or the `/image-edit` route can be dropped if Compose handles cropping inline. DECISION NEEDED. |

---

### 7.8 Mention picker

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| MentionPicker | `src/app/components/MentionPicker.tsx` | `src/components/MentionPicker.tsx` | Move as-is. Update import path for supabase. Wire into scaffold's ComposeScreen wherever `@` mention is typed. The scaffold ComposeScreen textarea needs a keydown listener to trigger the picker. |

---

### 7.9 Posts feed fetching

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| usePosts | `src/app/hooks/usePosts.ts` | `src/hooks/usePosts.ts` | Update import path. |
| usePost | `src/app/hooks/usePost.ts` | `src/hooks/usePost.ts` | Update import path. |
| HomeScreen feed | `src/app/screens/Home.tsx` | Wire into `src/screens/HomeScreen.tsx` | scaffold's HomeScreen uses `mock-data.ts`. Replace with `usePosts(agentId)`. The AgentDots component (which switches agent context) needs to drive the `agentId` filter. AgentDots must move from `src/app/components/AgentDots.tsx` → `src/components/AgentDots.tsx`. |
| AgentFeed | `src/app/screens/AgentFeed.tsx` | New: `src/screens/AgentFeedScreen.tsx` | scaffold has **no AgentFeed screen**. Route `/feed/:agentId` is missing. Must be created. Wired to `usePosts(agentId)` where agentId comes from URL params. See Section 10. |
| AgentProfile | `src/app/screens/AgentProfile.tsx` | New: `src/screens/AgentProfileScreen.tsx` | scaffold has **no AgentProfile screen**. Route `/agent/:agentId` is missing. Must be created. See Section 10. |
| PostDetailScreen | `src/app/screens/PostDetail.tsx` | Wire into `src/screens/PostDetailScreen.tsx` | scaffold has PostDetailScreen. Replace mock data with `usePost(postId)` and `useReplies(postId)`. |
| ExploreScreen | `src/app/screens/Explore.tsx` | Wire into `src/screens/ExploreScreen.tsx` | Port trending/agent discovery logic. |

---

### 7.10 Replies + agent reply trigger

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| useReplies hook | `src/app/hooks/useReplies.ts` | `src/hooks/useReplies.ts` | Update import path. |
| Reply submit → agent reply | Called from PostDetail.tsx: submits reply row, then POSTs to `/api/agent-reply` | Wire into `src/screens/PostDetailScreen.tsx` | scaffold's CommentsSection.tsx has mock comment submission. Replace with real reply insert + `/api/agent-reply` POST. The fetch to `/api/agent-reply` needs: `postId`, `replyText`, `agentId`, `userId`, bearer token. |

---

### 7.11 Likes + post_likes RPCs

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| useLike hook | `src/app/hooks/useLike.ts` | `src/hooks/useLike.ts` | Update import path. |
| Like button wiring | Called from PostCard.tsx in current src/ | Wire into scaffold's Post card (in `HomeScreen.tsx`, `PostDetailScreen.tsx`) | scaffold's post cards have a like button with mock `liked` state. Replace with `useLike(postId)` which calls the `toggle_post_like` RPC. |

---

### 7.12 Follows (user→agent, user→user)

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| useFollow hook | `src/app/hooks/useFollow.tsx` | `src/hooks/useFollow.tsx` | Update import path. |
| Follow button | Used in Profile.tsx, AgentProfile.tsx | Wire into scaffold's ProfileScreen, UserProfileScreen, AgentProfileScreen | scaffold's ProfileScreen has a Follow button with mock state. Replace with `useFollow(targetId)`. |

---

### 7.13 Notifications polling

| Item | Existing file | Target in new src/ | Structural changes needed |
|------|-------------|-------------------|--------------------------|
| NotificationsContext | `src/app/contexts/NotificationsContext.tsx` (168 lines) | `src/contexts/NotificationsContext.tsx` | Update import paths. |
| NotificationsProvider mount | Current `src/app/App.tsx` — **UNCONFIRMED.** The audit flagged NotificationsContext as existing but could not confirm it is mounted in App.tsx. **Check the current App.tsx before moving.** If NotificationsProvider is not in current App.tsx, add it to new `src/App.tsx` alongside AuthProvider. | `src/App.tsx` wraps with `<NotificationsProvider>` | Add `<NotificationsProvider>` inside `<AuthProvider>` (notifications requires auth). |
| NotificationsScreen | `src/app/screens/Notifications.tsx` | Wire into `src/screens/NotificationsScreen.tsx` | scaffold's NotificationsScreen has mock items. Replace with `useNotifications()` from NotificationsContext. |

---

### 7.14 Cost-control env vars (agent pipeline)

The agent reply pipeline in `/api/agent-reply.ts` has per-user and daily cost caps. These are enforced server-side via `SUPABASE_SERVICE_ROLE_KEY` and the `daily_spend_tracking` table (migration 011). **The frontend does not need to do anything for cost control.** The env vars (`ANTHROPIC_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) are already set in Vercel and are not client-side variables.

---

### 7.15 Agent constants

| Item | Existing file | Target in new src/ |
|------|-------------|-------------------|
| Agent config (IDs, names, colors) | `src/app/lib/agents.ts` | `src/lib/agents.ts` | Used by AgentDots, ComposeScreen agent picker, AgentFeed, AgentProfile. |

The scaffold's `lib/design-tokens.ts` already contains `AGENT_IDS` and agent color tokens, but maps differently. **Reconcile:** import agent ID constants from `src/lib/agents.ts` (which has the canonical Supabase `AGENT_PROFILE_IDS` from `api/_agents/constants.ts`) rather than from `design-tokens.ts`. The visual tokens (colors, names) in `design-tokens.ts` can stay — just make the IDs authoritative from `agents.ts`.

---

## 8. Capacitor / iOS

scaffold-sandbox has zero Capacitor integration. These pieces must be added to the new `src/` before the iOS build works.

### 8.1 StatusBar initialization in `main.tsx`

**Current `src/main.tsx` (lines 12–18) adds:**

```typescript
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
}
```

**Action:** scaffold-sandbox's `main.tsx` must gain these three imports and the `if` block. It must run **before** `ReactDOM.createRoot(...).render(...)` — the current `main.tsx` does this correctly (lines 7–11 before line 13's render call).

### 8.2 Safe-area CSS variables

**Current `src/styles/index.css` defines:**

```css
:root {
  --header-logo-height: 3rem;
  --dots-row-height: 4rem;
  --bottom-nav-height: 4rem;
  --bottom-nav-total: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
}
```

And utilities: `.pb-safe`, `.pt-safe`, `.mt-safe`, `.mb-safe`.

**scaffold-sandbox `globals.css` already defines `--ic-top-inset` and `--ic-bot-inset`** but NOT the `--header-logo-height`, `--dots-row-height`, `--bottom-nav-height`, or `--bottom-nav-total` tokens, and NOT the `pb-safe`/`pt-safe` utility classes.

**Action:** Add the above `:root` block and `@layer utilities` block to `src/styles/globals.css`. Also add `overscroll-behavior: none` on `html` and `body` (currently in root `src/styles/index.css` lines 54–68) — this prevents iOS WKWebView rubber-band bounce.

### 8.3 `capacitor.config.ts` `webDir`

`webDir: 'dist'` is already correct. scaffold-sandbox builds to `dist/` via Vite. No change.

### 8.4 `build:capacitor` script and PWA exclusion

The root `package.json` has:
```json
"build:capacitor": "CAPACITOR_BUILD=true vite build"
```

And `vite.config.ts` wraps the PWA plugin in:
```typescript
...(process.env.CAPACITOR_BUILD !== 'true' ? [VitePWA({...})] : [])
```

This means iOS builds skip the service worker. **No changes needed here** — the `vite.config.ts` logic is preserved.

### 8.5 `ios/` sync after the swap

After the src/ swap and a successful `vite build`, run:
```bash
npm run cap:sync
```
This copies `dist/` into `ios/App/App/public/` and updates plugin bridge files. Then open Xcode and test on device.

---

## 9. PWA

scaffold-sandbox has no PWA setup. The root's `vite.config.ts` already configures `vite-plugin-pwa` (conditionally, only when `CAPACITOR_BUILD !== 'true'`). The PWA config does not depend on anything in `src/` — it caches all `.{js,css,html,ico,png,svg,woff2}` outputs and uses `/offline.html` as the navigation fallback.

**What needs to be verified after the swap:**

| Item | Location | Action |
|------|----------|--------|
| Service worker | Generated by `vite-plugin-pwa` at build time → `dist/sw.js` | No source change needed. Will be regenerated on next build. |
| `offline.html` | `/public/offline.html` | **Unchanged. Keep.** |
| Manifest | Generated by `vite-plugin-pwa` from `vite.config.ts` manifest config | **Unchanged.** App name "Social Leveling", theme `#0A0A0A`, standalone mode, portrait. |
| PWA icons | `/public/icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png` | **Unchanged.** |
| Install prompt | UNKNOWN — check if current `src/` has a custom install prompt component. If so, port it. The standard `vite-plugin-pwa` auto-handles the browser prompt via `injectRegister: 'auto'`. |
| Supabase URL denylist | `vite.config.ts` runtime cache denylist | **Unchanged.** Will continue to bypass Supabase API calls from the service worker cache. |

---

## 10. Routes — what's missing in scaffold-sandbox

### 10.1 Route comparison

| Route | Current src/ screen | scaffold-sandbox screen | Status |
|-------|-------------------|------------------------|--------|
| `/auth` | `Auth.tsx` | `AuthScreen.tsx` | Exists in scaffold — needs wiring |
| `/reset-password` | `ResetPassword.tsx` | `PlaceholderScreen` | Needs replacement with real screen |
| `/` (onboarding) | `Onboarding.tsx` | `OnboardingScreen.tsx` | Exists in scaffold — needs wiring |
| `/home` | `Home.tsx` | `HomeScreen.tsx` | Exists in scaffold — needs wiring |
| `/feed/:agentId` | `AgentFeed.tsx` | **MISSING** | **Net-new screen required** |
| `/agent/:agentId` | `AgentProfile.tsx` | **MISSING** | **Net-new screen required** |
| `/leaderboard` | `Leaderboard.tsx` | `ArenasHubScreen.tsx` | Exists in scaffold (redesigned) — needs wiring |
| `/leaderboard/:category` | **Missing in src/** | `CategoryLeaderboardScreen.tsx` | Scaffold is ahead — wire to real data |
| `/post/:postId` | `PostDetail.tsx` | `PostDetailScreen.tsx` | Exists in scaffold — needs wiring |
| `/explore` | `Explore.tsx` | `ExploreScreen.tsx` | Exists in scaffold — needs wiring |
| `/profile` | `Profile.tsx` | `ProfileScreen.tsx` | Exists in scaffold — needs wiring |
| `/profile/:handle` | No direct equivalent (Profile.tsx only handles own user) | `UserProfileScreen.tsx` | Scaffold is ahead — needs new `useUserProfile` hook |
| `/notifications` | `Notifications.tsx` | `NotificationsScreen.tsx` | Exists in scaffold — needs wiring |
| `/settings` | `Settings.tsx` | `SettingsScreen.tsx` | Exists in scaffold — needs wiring |
| `/compose` | `Compose.tsx` | `ComposeScreen.tsx` | Exists in scaffold — needs wiring |
| `/image-edit` | `ImageEdit.tsx` | **MISSING** | Decision: port as new screen or merge into ComposeScreen |
| `/dms` | **Not in src/** | `DMListScreen.tsx` | Scaffold is ahead — mock-only for now; do not wire to backend until DM feature is built |
| `/dm/:threadId` | **Not in src/** | `DMThreadScreen.tsx` | Same — mock-only |
| `/paywall` | **Not in src/** | `PaywallScreen.tsx` | Same — mock-only |

### 10.2 Net-new screens needed (3)

1. **`src/screens/AgentFeedScreen.tsx`** — Route `/feed/:agentId`. Port from `src/app/screens/AgentFeed.tsx`. Reads `agentId` from URL params, calls `usePosts(agentId)`.

2. **`src/screens/AgentProfileScreen.tsx`** — Route `/agent/:agentId`. Port from `src/app/screens/AgentProfile.tsx`. Shows agent bio, posts, follow button. Calls `useFollow(agentId)`.

3. **`src/screens/ImageEditScreen.tsx`** — Route `/image-edit` (optional). Port from `src/app/screens/ImageEdit.tsx`, or remove the route if image cropping is handled inline in ComposeScreen.

### 10.3 RequireAuth — does scaffold have an equivalent?

**No.** scaffold-sandbox has no auth guard. All routes are public.

**What must be ported:** The `RequireAuth` component from `src/app/routes.tsx` (lines 10–36). Since the new src/ will use react-router v7's `createBrowserRouter`, `RequireAuth` becomes a wrapper component (using `<Outlet>`) in the nested route structure — identical to the current implementation. Port it to `src/lib/RequireAuth.tsx` and wire it in the new `src/App.tsx` route structure.

### 10.4 React Router v6 → v7 migration in scaffold's App.tsx

The scaffold's `App.tsx` uses react-router-dom v6 API:
- `BrowserRouter` wrapping (in `main.tsx`)
- `<Routes>` and `<Route>` components

The root uses react-router v7 API:
- `createBrowserRouter` + `RouterProvider`
- No `BrowserRouter` wrapper in `main.tsx`

**Migration:** Rewrite `src/App.tsx` to use `createBrowserRouter` with:
- Public routes: `/auth`, `/reset-password`
- RequireAuth wrapper: all other routes nested under it
- DesktopLayout / MobileLayout shell: nested under RequireAuth (scaffold's `Shell` component does this)
- Error boundaries: wrap each route component as current src/ does

`src/main.tsx` changes from:
```typescript
<BrowserRouter><App /></BrowserRouter>
```
to:
```typescript
<App />  // App itself exports <RouterProvider router={router} />
```

---

## 11. Migration order

Execute entirely on the `rebuild` branch. `main` is untouched until the final merge.

### Step 1 — Verify pre-conditions (Section 1)
Run through every checklist item in Section 1. Do not proceed until all are confirmed.

### Step 2 — Dependency delta (dry run)
Update root `package.json` with all changes from Section 5 and 6.7. Run `pnpm install`. Confirm no resolution errors. **Do not touch src/ yet.**

### Step 3 — Config updates (Section 6)
Update `tsconfig.json`, `vite.config.ts` (if Tailwind v4 stays, minimal changes), `postcss.config.mjs`. Run `vite build` — it will fail (src/ still has the old code) but confirm no config-level errors.

### Step 4 — Delete old src/
```bash
rm -rf src/
```

### Step 5 — Move scaffold-sandbox/src/ into src/
```bash
cp -r scaffold-sandbox/src src
```
(Or `mv scaffold-sandbox/src src` — either works since `scaffold-sandbox/` is kept as reference until verification.)

### Step 6 — Port lib files (no UI yet)
Drop in (no structural changes):
- `src/lib/supabase.ts`
- `src/lib/auth.ts`
- `src/lib/profiles.ts`
- `src/lib/database.types.ts`
- `src/lib/agents.ts`

Run `tsc --noEmit`. Fix any type errors (likely import path mismatches).

### Step 7 — Add contexts
Port `src/contexts/AuthContext.tsx` and `src/contexts/NotificationsContext.tsx`. Add hooks directory: `src/hooks/`. Port `useProfile.ts`, `useCreatePost.ts`, `usePosts.ts`, `usePost.ts`, `useReplies.ts`, `useLike.ts`, `useFollow.tsx`.

### Step 8 — Rewrite src/main.tsx
Add Capacitor StatusBar init, remove BrowserRouter wrapper, import CSS (globals.css + safe-area additions from Section 8.2).

### Step 9 — Rewrite src/App.tsx
Replace scaffold's v6 Routes API with v7 `createBrowserRouter`. Add AuthProvider, NotificationsProvider, AppErrorBoundary, Toaster. Add RequireAuth. Wire all routes to scaffold screens. Add missing routes (AgentFeed, AgentProfile as placeholders initially).

Run `vite build`. Confirm build passes. Open browser at `/auth` — auth screen should render (still mock at this point).

### Step 10 — Port CSS
Merge current `src/styles/index.css` safe-area tokens and animation keyframes into `src/styles/globals.css`. Add overscroll-behavior: none. Port font import (decision: Google Fonts DM Sans or @fontsource Inter — see Section 14).

### Step 11 — Wire auth screens (Section 7.3)
Wire `AuthScreen.tsx` to `signIn`/`signUp` from `auth.ts`. Wire `OnboardingScreen.tsx`. Replace `PlaceholderScreen` at `/reset-password` with real `ResetPassword` logic. Test sign-up → onboarding → home flow end-to-end in browser.

### Step 12 — Wire HomeScreen and PostCard
Wire `HomeScreen.tsx` to `usePosts`. Port `AgentDots` component. Port `PostCard` (or use scaffold's primitive components). Test post feed renders from Supabase.

### Step 13 — Wire remaining screens one by one
In order of user-facing importance:
1. ProfileScreen → `useProfile`
2. PostDetailScreen → `usePost` + `useReplies`
3. ComposeScreen → `useCreatePost` (with image upload)
4. NotificationsScreen → `NotificationsContext`
5. ExploreScreen → trending posts query
6. LeaderboardScreen / ArenasHubScreen → leaderboard data
7. SettingsScreen → account settings (currently static in src/)
8. AgentFeedScreen (net-new)
9. AgentProfileScreen (net-new)
10. UserProfileScreen → new `useUserProfile` hook

### Step 14 — Add missing screens (Section 10.2)
Create `AgentFeedScreen.tsx`, `AgentProfileScreen.tsx`. Add routes to `App.tsx`.

### Step 15 — Capacitor sync
```bash
npm run build:capacitor
npx cap sync ios
npx cap open ios
```
Test on iOS simulator. Verify: StatusBar style, safe-area insets, no rubber-band bounce, navigation works.

### Step 16 — PWA smoke test
Run `vite build` (non-capacitor). Serve `dist/`. Verify: service worker registers, offline.html loads when network is cut, manifest installs correctly.

### Step 17 — Vercel preview deploy
Push `rebuild` branch. Wait for Vercel preview build. Verify:
- Cron job `/api/generate-posts` is still listed
- Auth flow works on preview URL
- Agent reply flow works (POST a comment, wait for reply)
- Image upload works

### Step 18 — Delete scaffold-sandbox/
Once rebuild branch preview is verified clean:
```bash
rm -rf scaffold-sandbox/
```
Commit.

### Step 19 — Merge to main
Open PR from `rebuild` → `main`. Review for regressions. Merge.

---

## 12. Risks and unknowns

### Risk 1 — PKCE / StorageEvent workaround portability (HIGH)
The `signIn` function in `src/lib/auth.ts` uses `window.dispatchEvent(new StorageEvent(...))` to unblock the PKCE deadlock in `supabase.auth.setSession()`. This is fragile because:
- It relies on `AuthContext.tsx`'s `window.addEventListener('storage', ...)` handler being mounted before `signIn` is called.
- If `AuthProvider` is not in the component tree when `signIn` fires (e.g., if auth screens render outside `AuthProvider`), the event is dispatched but nothing listens.
- **Mitigation:** Ensure `AuthProvider` wraps the entire app including auth screens (it does in current `App.tsx`; must be preserved in new `App.tsx`).
- **Test:** After wire-up, sign in and immediately check `localStorage.getItem('inner-circle-auth')` is populated and `useAuth().session` is non-null.

### Risk 2 — Tailwind v3 vs v4 cascade difference (HIGH)
scaffold's components use Tailwind classes like `bg-bg`, `text-mute`, `bg-agent-baron` which are custom token names from `tailwind.config.ts`. If Tailwind v4 is kept:
- v4 uses `@theme` CSS blocks, not `theme.extend.colors` in a config file.
- The class name generation still works (`bg-bg`, `text-mute`, etc.) IF the tokens are declared in `@theme` using the `--color-bg`, `--color-mute` naming convention.
- However, v4's `@theme inline` uses `--color-*` variables. scaffold's classes are `bg-bg`, not `bg-[#070707]`. This requires that the token names in `@theme` exactly match what scaffold's components expect.
- **Mitigation:** Before Step 9, audit the first 3 scaffold screens' Tailwind classes against the proposed `@theme` block. Fix any naming mismatches. Consider using `tailwind-merge` already in root deps.

### Risk 3 — React Router v6 → v7 migration (MEDIUM)
scaffold's `App.tsx` and all screens use `import { useNavigate, useParams, Link } from 'react-router-dom'` (v6 package). root uses `react-router` (v7, different package name). The v7 API is largely backward-compatible with v6 for hooks and components, but the package import path changes.

- **Fix:** Global search-replace `from 'react-router-dom'` → `from 'react-router'` across all scaffold files after the move.
- **Remaining diff:** The `<Routes>/<Route>` in scaffold's `App.tsx` must be replaced with `createBrowserRouter` (Step 9). This is a structural rewrite of App.tsx, not a find-replace.

### Risk 4 — UserProfileScreen requires a net-new hook (MEDIUM)
`src/screens/UserProfileScreen.tsx` in scaffold shows another user's profile by handle (e.g., `/profile/nina_j`). Current `src/app/hooks/useProfile.ts` fetches **by userId**, not by handle. A `useUserProfile(handle: string)` hook does not exist. It must be authored:
- Query `profiles` table where `username = handle`
- Return profile data (same shape as `useProfile`)
- The existing Supabase RLS policies must allow reading other users' public profile data (verify migration 002).

### Risk 5 — NotificationsProvider mount status (MEDIUM)
The audit could not confirm whether `NotificationsProvider` is currently mounted in `src/app/App.tsx`. If it is not (the current `main` App.tsx only has `AuthProvider` wrapping), then notifications have never been live in production. **Check before porting.** If `NotificationsContext` is unused in production, decide whether to mount it in the new `App.tsx` or defer.

### Risk 6 — Capacitor build after structural changes (MEDIUM)
`cap sync` copies the `dist/` directory into the iOS project. If the new `main.tsx` has syntax errors or the build fails, `cap sync` will either fail or sync an empty/broken `dist/`. This breaks the iOS app until fixed.
- **Mitigation:** Always run `vite build` and confirm zero errors before running `cap sync`.

### Risk 7 — Service worker cache invalidation (LOW)
After the swap, the new build generates different content hashes. Existing users who have a cached service worker from the old `main` build may not update immediately (autoUpdate mode sends a new SW after navigation). This is cosmetic — the new SW will update on the user's next app load. No data loss risk.

---

## 13. Effort estimate

Broken down by Section 11's steps. "Session" = one focused Claude Code prompt session.

| Step | Work | Sessions |
|------|------|---------|
| Step 1 — Pre-conditions verify | Manual checklist (human) | 0 (human task) |
| Step 2 — package.json delta + pnpm install | Mechanical edits, fix conflicts | 0.5 |
| Step 3 — Config updates (tsconfig, vite, postcss) | Small targeted edits | 0.5 |
| Steps 4–5 — Delete src/, move scaffold | Single shell operation | 0.5 |
| Step 6 — Port lib files (supabase, auth, profiles, types, agents) | File copies + tsc check | 0.5 |
| Step 7 — Port contexts + all hooks | 9 files, mostly path fixes | 1 |
| Step 8 — Rewrite main.tsx | 30 lines | 0.25 |
| Step 9 — Rewrite App.tsx (v6→v7 router, providers) | Structural rewrite | 1 |
| Step 10 — Port CSS / tokens / safe-area | Tailwind token audit + CSS edits | 1 |
| Step 11 — Wire auth screens + test auth flow | 3 screens + end-to-end test | 1.5 |
| Step 12 — Wire HomeScreen + PostCard + AgentDots | 3 components + live data test | 1 |
| Step 13 — Wire remaining 10 screens | 10 screens, 1–3 per session | 4 |
| Step 14 — Create AgentFeedScreen + AgentProfileScreen | 2 net-new screens | 1 |
| Step 15 — Capacitor sync + iOS test | Build + simulator test | 0.5 |
| Step 16 — PWA smoke test | Build + serve + verify | 0.5 |
| Step 17 — Vercel preview + agent pipeline test | Deploy + manual test | 0.5 |
| Step 18 — Cleanup (rm scaffold-sandbox) | 1 command + commit | 0.25 |
| Step 19 — PR + merge | PR creation | 0.25 |
| **Buffer for unexpected issues** | Type errors, RLS surprises, CSS regressions | 2 |
| **TOTAL** | | **~17 sessions** |

**Honest assessment:** The backend wire-up (Steps 11–14) is where time disappears. Each screen looks simple in isolation but has 3–5 edge cases (loading states, empty states, error handling, optimistic updates). Plan for 17 sessions; budget for 20.

---

## 14. Open questions for the user

These must be decided **before execution begins**. Execution cannot proceed on Steps 2–3 (dependency delta and config) without answers to Q1–Q3.

### Q1 — Tailwind v3 or v4?

**Context:** scaffold-sandbox was designed and tested with Tailwind v3. The current production `main` uses Tailwind v4. The `rebuild` branch will replace `src/` entirely, so there is no CSS compatibility obligation to the old `src/`.

- **Option A (v4):** Keep v4 in root. Port scaffold's `tailwind.config.ts` tokens into a `@theme inline` CSS block. This requires careful verification that scaffold's class names (`bg-bg`, `text-mute`, `bg-agent-baron`) resolve correctly under v4's naming conventions. Higher upfront risk, zero long-term migration debt.
- **Option B (v3):** Downgrade root from v4 to v3. Use scaffold's existing `tailwind.config.ts` as-is. Zero porting risk for scaffold classes. The current `main` branch still uses v4, but since `rebuild` is replacing `main`, this is acceptable. Slightly larger pnpm install diff.

**Recommendation:** v4, but only if you're willing to spend an extra 0.5 session on the token audit (Step 10).

---

### Q2 — Keep Radix/shadcn or drop it?

**Context:** The current `src/` has 55 shadcn/Radix components. scaffold-sandbox uses none of them. The new `src/` (scaffold) has its own design system built from CSS primitives. Keeping Radix/shadcn means carrying 35 packages that will never be used in the new frontend.

- **Option A (drop):** Remove all 35 `@radix-ui/*` packages and `class-variance-authority`, `cmdk`, `input-otp`, `vaul`, `clsx` from `package.json`. The scaffold's design system does not need them. This is the recommended path.
- **Option B (keep as opt-in):** Keep them in `package.json` as available-but-unused dependencies. Useful if you plan to re-introduce a specific component (e.g., `@radix-ui/react-dialog` for the mention picker popup or a modal). Increases install size but reduces risk.

**Recommendation:** Drop them. Add back individual packages when a specific need arises.

---

### Q3 — Font stack: Google Fonts (DM Sans/Outfit/Unbounded) or @fontsource (Inter/Geist)?

**Context:** Current `src/` loads `DM Sans`, `Outfit`, `Unbounded` from Google Fonts via CSS `@import` in `fonts.css`. scaffold-sandbox uses `@fontsource/inter` (Inter), `@fontsource/geist-sans`, `@fontsource/geist-mono` loaded via npm. The two font stacks are visually incompatible — mixing them would look inconsistent.

- **Option A (@fontsource — scaffold's choice):** Use Inter as the UI font, Geist Mono for code/numbers. Add the three `@fontsource/*` packages to root. No Google Fonts network dependency (better offline/PWA behavior). scaffold's CSS is already written for Inter.
- **Option B (Google Fonts — current src/ choice):** Keep DM Sans/Outfit/Unbounded. Update scaffold's `globals.css` to add the Google Fonts `@import`. Requires updating scaffold's `fontFamily` tokens. More visual continuity with existing users.

**Recommendation:** @fontsource (Option A). scaffold's entire visual system was designed for Inter. Forcing DM Sans in would require testing every screen.

---

### Q4 — New branch off rebuild, or continue on rebuild?

**Context:** `rebuild` currently has the profile screen work (commits `4c95ba9a`, `c58c9b40`, etc.). This work will be **entirely overwritten** when `src/` is deleted.

- **Option A (new branch `rebuild-v2` off rebuild):** Creates a clean commit history. If the swap goes wrong, `rebuild` is preserved.
- **Option B (continue on rebuild):** Simpler, fewer branches. The profile screen commits are made irrelevant by the swap. Since `main` is the production branch, there is no risk to users.

**Recommendation:** Continue on `rebuild`. The old `rebuild` commits will be buried by the swap commits but remain in git history.

---

### Q5 — What to do with DM, Paywall, and CategoryLeaderboard screens?

**Context:** scaffold-sandbox has `DMListScreen`, `DMThreadScreen`, `PaywallScreen`, and `CategoryLeaderboardScreen` — none of which exist in current `src/`. They are pure design scaffolds with mock data.

- **DM screens:** Leave mock-only. Do NOT wire to any backend. DM feature does not exist in the database schema (no `messages` table in migrations 001–015).
- **PaywallScreen:** Leave mock-only. No payment infrastructure exists.
- **CategoryLeaderboardScreen:** This CAN be wired — the leaderboard data (agent follower counts) is in Supabase. The `/leaderboard/:category` route and `CategoryLeaderboardScreen.tsx` just need to query the `profiles` table for the specific agent.

**Decision needed:** Should `/leaderboard/:category` be wired to real data in this migration, or left as a follow-up?

---

### Q6 — ImageEdit screen: port or drop?

**Context:** Current `src/app/screens/ImageEdit.tsx` is at route `/image-edit`. It provides image cropping/editing before posting. scaffold-sandbox has no equivalent.

- **Port:** Carry over `ImageEdit.tsx` as `src/screens/ImageEditScreen.tsx`. Add the route to the new `App.tsx`. The component depends on `react-easy-crop` (currently in root deps).
- **Drop:** Remove the `/image-edit` route. Handle any image cropping inline in `ComposeScreen.tsx`.

**Decision needed before Step 14.**
