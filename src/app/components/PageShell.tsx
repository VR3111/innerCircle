import type { ReactNode } from "react";
import { cn } from "./ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageShellProps {
  children: ReactNode;

  /**
   * Whether the page content is scrollable.
   * Always true for now — all screens use document-level scroll so iOS
   * momentum scrolling works in Capacitor/Safari. Reserved for future
   * inner-scroll use cases (e.g. a sheet that scrolls independently).
   * Default: true
   */
  scrollable?: boolean;

  /**
   * Whether to add padding-bottom to clear the fixed BottomNav.
   * Pass false for screens that have no BottomNav (e.g. PostDetail, Auth).
   * Default: true
   */
  hasBottomNav?: boolean;

  /**
   * When true, PageShell does NOT add top safe-area padding.
   * Use this for screens that manage their own sticky header — the header
   * itself applies `pt-safe` so content isn't double-padded.
   * Default: false
   */
  hasStickyHeader?: boolean;

  /**
   * Additional Tailwind classes merged onto the shell div.
   * Useful for screen-specific background overrides or min-heights.
   */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PageShell — the shared mobile layout wrapper for Social Leveling.
 *
 * DESKTOP (≥ 1024px / Tailwind `lg:`):
 *   Renders as `display: contents` — this element's box is removed from the
 *   layout tree entirely. Children render as if PageShell doesn't exist.
 *   DesktopLayout.tsx handles all desktop chrome (sidebars, scroll, spacing).
 *
 * MOBILE (< 1024px):
 *   Provides the standard mobile layout frame:
 *   - min-height: 100dvh  — dynamic viewport height for correct iOS bar handling
 *   - overflow-x: hidden  — prevents accidental horizontal scroll
 *   - pt-safe             — padding-top: env(safe-area-inset-top), unless
 *                           hasStickyHeader is true (the screen's own header
 *                           does it instead)
 *   - padding-bottom      — env(safe-area-inset-bottom) always, PLUS
 *                           var(--bottom-nav-height) when hasBottomNav is true
 *                           (combined as var(--bottom-nav-total))
 *
 * SCROLL MODEL:
 *   PageShell does NOT create a new scroll container. The page scrolls at
 *   the document level, which is required for:
 *   - iOS momentum scroll (WKWebView inertia requires document scroll)
 *   - window.scrollY reads in Home.tsx hide-on-scroll logic
 *   - sticky headers (position:sticky works relative to the scroll container;
 *     if scroll were inside a div, sticky would need overflow:hidden removed)
 *
 * USAGE:
 *   <PageShell hasBottomNav hasStickyHeader>
 *     ...screen content...
 *   </PageShell>
 *
 * NOT IN SCOPE (stay in individual screens):
 *   - Screen-specific headers and their sticky behavior
 *   - Hide-on-scroll animations (Home dots)
 *   - Screen-specific background colors
 *   - Screen-specific max-widths
 *
 * Phase 1: This component exists but is NOT applied to any screen yet.
 * Phase 2: Each screen will be migrated to use PageShell.
 */
export default function PageShell({
  children,
  scrollable: _scrollable = true,
  hasBottomNav = true,
  hasStickyHeader = false,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        // ── Desktop passthrough ──────────────────────────────────────────────
        // `display: contents` removes this element's box from the layout tree.
        // Margin, padding, overflow, min-height — all become irrelevant on lg+.
        // Children render as direct children of the parent (DesktopLayout's
        // center <main> column).
        "lg:contents",

        // ── Mobile shell ─────────────────────────────────────────────────────
        // These classes are no-ops when display:contents is active (lg+).

        // Dynamic viewport height — 100dvh shrinks when the iOS browser chrome
        // appears, preventing the "overscroll reveals background" artifact.
        "min-h-dvh",

        // Enforce no horizontal overflow at the shell level. Catches any
        // child that accidentally exceeds 100vw without requiring every screen
        // to remember to set this.
        "overflow-x-hidden",

        // Top safe area — only when the screen doesn't own a sticky header.
        // Screens with hasStickyHeader=true apply pt-safe on their header div,
        // so we must NOT add it here or content would be double-inset.
        !hasStickyHeader && "pt-safe",

        className,
      )}
      style={
        // Bottom padding is a runtime calc — we can't express this cleanly
        // as a static Tailwind class because it combines a CSS custom property
        // with an env() function.
        //
        // hasBottomNav=true:  var(--bottom-nav-total)
        //   = var(--bottom-nav-height) + env(safe-area-inset-bottom)
        //   = 4rem (64px, h-16) + device safe inset
        //
        // hasBottomNav=false: env(safe-area-inset-bottom) only
        //   Screens like PostDetail or Auth still need the bare safe area
        //   so content doesn't bleed under the home indicator.
        hasBottomNav
          ? { paddingBottom: "var(--bottom-nav-total)" }
          : { paddingBottom: "env(safe-area-inset-bottom)" }
      }
    >
      {children}
    </div>
  );
}
