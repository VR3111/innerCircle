/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * BREAKPOINT STRATEGY — Social Leveling Mobile/Responsive Rework
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * THE SINGLE SOURCE OF TRUTH FOR THE MOBILE/DESKTOP BOUNDARY.
 * All layout decisions that depend on "am I on mobile or desktop?" flow from
 * the constant defined in this file.
 *
 * ── Decision ─────────────────────────────────────────────────────────────────
 *
 *   Mobile layout:   < 1024px
 *     Covers all phones (320–430px), phablets (430–767px), small tablets in
 *     portrait (768–1023px), and narrow browser windows.
 *     Shows: single-column feed, BottomNav, no sidebar.
 *
 *   Desktop layout:  ≥ 1024px
 *     Covers iPad landscape (1024px+) and all desktop browsers.
 *     Shows: 3-column layout with left sidebar and right sidebar via
 *     DesktopLayout.tsx (unchanged in Phase 1).
 *
 * ── Why 1024px, not 768px (the current md: threshold)? ──────────────────────
 *
 *   768px (md) is iPad portrait width. An iPad in portrait should get the
 *   mobile layout with BottomNav — it's a touch-primary device in that
 *   orientation and the 3-column desktop sidebar is too cramped at 768px.
 *   1024px gives 3-column a comfortable minimum width (each column gets ≥280px).
 *
 * ── How to express this in Tailwind ──────────────────────────────────────────
 *
 *   Tailwind prefix: `lg:` means "1024px and above" (desktop and above)
 *   Inverse:         `max-lg:` means "below 1024px" (mobile only)
 *
 *   Examples:
 *     lg:hidden          → hide on desktop (show on mobile)
 *     max-lg:hidden      → hide on mobile (show on desktop)
 *     lg:flex            → flex layout on desktop
 *     lg:pb-0            → remove bottom padding on desktop
 *     lg:contents        → display:contents on desktop (layout passthrough)
 *
 *   NOTE: The existing DesktopLayout.tsx uses `md:` (768px) for its own
 *   mobile/desktop branching. It will be migrated to `lg:` in Phase 3.
 *   During Phase 2, PageShell and screens will already use `lg:`, so there
 *   will be a 768–1023px range where DesktopLayout still shows mobile AND
 *   screens are using the new lg: breakpoint. This is safe because PageShell
 *   is not applied to any screen until Phase 2, and DesktopLayout migration
 *   is Phase 3.
 *
 * ── JavaScript constant ───────────────────────────────────────────────────────
 *
 *   Use DESKTOP_BREAKPOINT anywhere you need a numeric breakpoint in JS/TS
 *   (e.g. window.innerWidth checks, matchMedia calls).
 *   This replaces the hardcoded `< 768` in Notifications.tsx:198.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** The viewport width (px) at and above which the desktop layout is shown. */
export const DESKTOP_BREAKPOINT = 1024 as const;

/**
 * Tailwind responsive prefix for "desktop and above."
 * Usage: `${TW_DESKTOP}hidden` → "lg:hidden"
 */
export const TW_DESKTOP = "lg:" as const;

/**
 * Returns true when the current viewport is in desktop range.
 * Use this only inside effects/event handlers — NOT during render
 * (SSR would break; prefer CSS/Tailwind for static layout decisions).
 */
export function isDesktopViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT;
}
