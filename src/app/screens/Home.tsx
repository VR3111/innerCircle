import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { Bell } from "lucide-react";
import { motion, useScroll, useMotionValueEvent, useAnimate } from "motion/react";
import { useNotifications } from "../contexts/NotificationsContext";
import AgentDots from "../components/AgentDots";
import PostCard from "../components/PostCard";
import BottomNav from "../components/BottomNav";
import { usePosts } from "../hooks/usePosts";

export default function Home() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { posts, loading, error } = usePosts();

  // ── Scroll-linked dots collapse ─────────────────────────────────────────────
  // dotsRef targets the dots row wrapper div INSIDE the fixed container.
  // Only fires on direction change; Motion cancels in-flight tweens automatically.
  const [dotsRef, animateDots] = useAnimate();
  const { scrollY } = useScroll();
  const lastY = useRef(0);
  const dotsHidden = useRef(false);

  // Capture the natural pixel height of the dots row after first paint.
  // We animate TO this value when revealing (height: "auto" is not supported
  // by useAnimate's imperative API; pixel value is reliable since the dots
  // content never changes height).
  const dotsNaturalHeight = useRef(0);
  useEffect(() => {
    if (dotsRef.current) {
      dotsNaturalHeight.current = dotsRef.current.offsetHeight;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useMotionValueEvent(scrollY, "change", (y) => {
    const diff = y - lastY.current;
    lastY.current = y;

    if (y <= 10) {
      if (dotsHidden.current) {
        dotsHidden.current = false;
        // Restore to captured natural height — fixed container expands back.
        animateDots(dotsRef.current, { height: dotsNaturalHeight.current, opacity: 1 }, { duration: 0.22, ease: [0.25, 0, 0, 1] });
      }
    } else if (diff > 2 && !dotsHidden.current) {
      dotsHidden.current = true;
      // Collapse height to 0 — fixed container shrinks to just the logo row,
      // eliminating the dark dead-rectangle that remained with translate-only.
      // opacity: 0 fades the content while overflow-y: hidden on this wrapper
      // clips it as the height reduces, preventing visible overflow.
      animateDots(dotsRef.current, { height: 0, opacity: 0 }, { duration: 0.22, ease: [0.25, 0, 0, 1] });
    } else if (diff < -2 && dotsHidden.current) {
      dotsHidden.current = false;
      animateDots(dotsRef.current, { height: dotsNaturalHeight.current, opacity: 1 }, { duration: 0.22, ease: [0.25, 0, 0, 1] });
    }
  });

  const handleAgentClick = (agentId: string) => {
    if (agentId === "all") return;
    navigate(`/feed/${agentId}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">

      {/*
        ── MOBILE: single unified fixed header ───────────────────────────────────
        One position:fixed container for logo row + dots row eliminates any
        possible rendering gap between them — they are siblings in the same
        element, sharing one background paint.

        overflow:hidden — prevents the AgentDots scroll content (456px natural
        width) from escaping the viewport-wide container. This is the root
        cause of the page-level horizontal scroll on iPhone: WebKit's flex +
        overflow-x:auto container can expand to content-size and leak past
        a parent that has overflow:visible (the default). The outer scroll /
        inner flex split in AgentDots also addresses this at the component
        level; overflow:hidden here is the safety net.
        Vertical clipping is handled on the dotsRef wrapper (overflow-y:hidden)
        so content clips cleanly as height collapses toward zero.

        box-shadow: soft depth / bottom-edge blend — spreads below the header
        so cards emerging from under it feel graduated, not slab-cut.
        Pure CSS, no blur, WKWebView-safe.

        No backdrop-blur: avoided throughout (WKWebView sticky/fixed + blur
        causes the element to drift on scroll — diagnosed in earlier sessions).
      */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] overflow-hidden pt-safe"
        style={{ boxShadow: "0 6px 20px 4px rgba(0,0,0,0.7)" }}
      >
        {/*
          Logo row — relative z-10 bg-[#0A0A0A]:
          Paints above the dots row in CSS stacking order. When the dots row
          animates upward (translateY), it passes visually behind this element.
          The solid background covers the dots cleanly — no bleed-through.
        */}
        <div className="relative z-10 bg-[#0A0A0A] flex items-center justify-between px-6 h-12">
          <h1 className="font-['Unbounded'] font-bold text-white tracking-[0.08em] flex items-center gap-2">
            {/* Slow 360° rotation — 10s per revolution, linear, forever */}
            <motion.span
              className="text-xl text-[#E9C46A] inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              ◈
            </motion.span>
            <motion.span
              className="text-sm tracking-[0.22em]"
              style={{
                background: "linear-gradient(90deg, #ffffff 0%, #ffffff 35%, #E9C46A 50%, #ffffff 65%, #ffffff 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
              animate={{ backgroundPosition: ["100% center", "-100% center"] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            >
              SOCIAL LEVELING
            </motion.span>
          </h1>
          <Link to="/notifications" className="p-2 relative">
            <Bell size={22} strokeWidth={1.5} className="text-white" />
            {unreadCount > 0 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E63946] rounded-full" />
            )}
          </Link>
        </div>

        {/*
          Dots row — animation target via dotsRef.
          Collapses via height: 0 + opacity: 0 on scroll-down so the fixed
          container shrinks to just the logo row — no dark dead-rectangle.
          overflow-y: hidden clips AgentDots content as height reduces without
          disturbing AgentDots' own overflow-x: auto horizontal scroll.
          The compact prop reduces internal py-4 → py-2 (tighter in the header).
        */}
        <div ref={dotsRef} style={{ overflowY: "hidden" }}>
          <AgentDots compact activeAgent="all" onAgentClick={handleAgentClick} />
        </div>
      </div>

      {/*
        ── MOBILE: document-flow spacer ─────────────────────────────────────────
        Reserves vertical space equal to the fixed header height so the first
        post card sits fully below the header at scroll-position-0. Using a
        spacer (not padding-top on the feed) lets md:py-8 on the feed work
        without inline-style specificity conflicts on desktop.

        height = env(safe-area-inset-top)   ← iOS status bar
               + var(--header-logo-height)   ← 3rem / 48px (h-12 logo row)
               + var(--dots-row-height)       ← 4rem / 64px (compact dots row)
               = env(safe-area-inset-top) + 7rem

        md:hidden: on desktop the sticky dots bar is in-flow and pushes
        content down naturally; no spacer needed.
      */}
      <div
        className="md:hidden"
        style={{ height: "calc(env(safe-area-inset-top) + var(--header-logo-height) + var(--dots-row-height))" }}
        aria-hidden="true"
      />

      {/*
        ── DESKTOP: agent dots only ──────────────────────────────────────────────
        In-flow sticky — no fixed positioning or spacer needed on desktop.
        Desktop layout renders the logo in the left sidebar (DesktopLayout.tsx).
      */}
      <div className="hidden md:block sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <AgentDots activeAgent="all" onAgentClick={handleAgentClick} />
      </div>

      {/*
        Feed — unified across mobile and desktop center column.

        No pt on mobile: the spacer above handles the vertical offset.
        md:py-8: desktop top padding below the sticky dots bar.
        relative z-0: contains child stacking contexts (e.g. motion.button
        whileTap) below the fixed header layers.
      */}
      <div className="relative z-0 max-w-[520px] mx-auto px-4 pb-4 md:py-8 md:px-6">

        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24 text-white/30 font-['DM_Sans'] text-sm">
            Failed to load posts
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-24 text-white/30 font-['DM_Sans'] text-sm">
            No posts yet
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="flex flex-col gap-5">
            {posts.map(({ post, agent }) => (
              <PostCard key={post.id} post={post} agent={agent} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
