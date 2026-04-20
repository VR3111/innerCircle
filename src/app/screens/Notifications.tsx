import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowLeft, TrendingUp, CheckCircle2, Trophy, Star, X,
} from "lucide-react";
import {
  motion, AnimatePresence, useMotionValue, animate,
} from "motion/react";
import { NotificationType } from "../data/notificationsData";
import { getAgentById } from "../data/mockData";
import { useNotifications } from "../contexts/NotificationsContext";
import BottomNav from "../components/BottomNav";

// ─── Type config ──────────────────────────────────────────────────────────────

const typeConfig: Record<
  NotificationType,
  { color: string; borderColor: string; bgColor: string }
> = {
  rank:         { color: "#2A9D8F", borderColor: "#2A9D8F", bgColor: "#2A9D8F15" },
  inner_circle: { color: "#E9C46A", borderColor: "#E9C46A", bgColor: "#E9C46A10" },
  agent_post:   { color: "#FFFFFF", borderColor: "#FFFFFF", bgColor: "#FFFFFF08" },
  leaderboard:  { color: "#E63946", borderColor: "#E63946", bgColor: "#E6394610" },
};

// ─── Icon ─────────────────────────────────────────────────────────────────────

function NotificationIcon({
  type,
  agentId,
}: {
  type: NotificationType;
  agentId?: string;
}) {
  if (type === "agent_post" && agentId) {
    const agent = getAgentById(agentId);
    if (agent) {
      return (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: agent.color, boxShadow: `0 0 10px ${agent.color}40` }}
        >
          <span className="font-['Outfit'] font-bold text-white text-sm">
            {agent.initial}
          </span>
        </div>
      );
    }
  }

  const cfg = typeConfig[type];
  const Icon =
    type === "rank"         ? TrendingUp   :
    type === "inner_circle" ? CheckCircle2 :
    type === "leaderboard"  ? Trophy       :
    Star;

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: cfg.bgColor, border: `1px solid ${cfg.color}30` }}
    >
      <Icon size={16} strokeWidth={1.75} style={{ color: cfg.color }} />
    </div>
  );
}

// ─── Swipeable / hoverable row ────────────────────────────────────────────────

const SWIPE_THRESHOLD = -72;
const DISMISS_WIDTH   = 80;

function NotificationRow({
  notification,
  onDismiss,
  canSwipe,
}: {
  notification: ReturnType<typeof useNotifications>["items"][number];
  onDismiss: (id: number) => void;
  canSwipe: boolean;
}) {
  const cfg =
    notification.type === "agent_post" && notification.agentId
      ? (() => {
          const agent = getAgentById(notification.agentId);
          return agent
            ? { color: agent.color, borderColor: agent.color, bgColor: `${agent.color}08` }
            : typeConfig["agent_post"];
        })()
      : typeConfig[notification.type];

  const x = useMotionValue(0);

  const handleDragEnd = (_: never, info: { offset: { x: number } }) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      // Animate fully off, then dismiss
      animate(x, -DISMISS_WIDTH * 1.5, {
        duration: 0.18,
        onComplete: () => onDismiss(notification.id),
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 350, damping: 32 });
    }
  };

  return (
    <div className="relative overflow-hidden group">

      {/* ── Dismiss action (mobile, revealed by swipe) ── */}
      <div className="md:hidden absolute inset-y-0 right-0 flex items-stretch">
        <button
          onClick={() => onDismiss(notification.id)}
          className="w-20 bg-[#E63946] flex flex-col items-center justify-center gap-1 flex-shrink-0"
        >
          <X size={16} className="text-white" strokeWidth={2} />
          <span className="font-['Outfit'] font-bold text-white text-[10px] uppercase tracking-wide">
            Dismiss
          </span>
        </button>
      </div>

      {/* ── Row content ── */}
      <motion.div
        style={{ x }}
        drag={canSwipe ? "x" : false}
        dragConstraints={{ left: -DISMISS_WIDTH, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        onDragEnd={handleDragEnd}
        className="relative"
        style={{ x, backgroundColor: "#0A0A0A" }}
      >
        <Link to={notification.href}>
          <div
            className="flex items-start gap-3.5 px-4 py-3.5 border-l-[3px] transition-colors hover:bg-white/[0.03]"
            style={{
              borderLeftColor: cfg.borderColor,
              backgroundColor: notification.read ? "transparent" : `${cfg.color}06`,
            }}
          >
            {/* Icon */}
            <div className="mt-0.5 flex-shrink-0">
              <NotificationIcon type={notification.type} agentId={notification.agentId} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p
                  className={`font-['Outfit'] font-semibold text-sm leading-snug ${
                    notification.read ? "text-white/70" : "text-white"
                  }`}
                >
                  {notification.title}
                </p>
                <span className="font-['DM_Sans'] text-white/25 text-[10px] flex-shrink-0 mt-0.5">
                  {notification.timestamp}
                </span>
              </div>
              <p className="font-['DM_Sans'] text-white/40 text-xs leading-relaxed mt-1">
                {notification.subtitle}
              </p>
            </div>

            {/* Unread dot (mobile) — hidden on desktop where X occupies that space */}
            {!notification.read && (
              <div
                className="md:hidden w-2 h-2 rounded-full flex-shrink-0 mt-2"
                style={{ backgroundColor: cfg.color }}
              />
            )}
          </div>
        </Link>

        {/* ── Desktop X button (hover) ── */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onDismiss(notification.id);
          }}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/8"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </motion.div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const { items, unreadCount, dismiss, markAllRead, clearAll } = useNotifications();

  // Detect mobile once on mount for swipe enable
  const [canSwipe, setCanSwipe] = useState(false);
  useEffect(() => {
    setCanSwipe(window.innerWidth < 768);
  }, []);

  const unread = items.filter((n) => !n.read);
  const read   = items.filter((n) =>  n.read);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-[375px] md:max-w-none mx-auto flex items-center gap-3 px-4 md:px-6 h-16">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>

          {/* Title + badge */}
          <div className="flex-1 flex items-center gap-2.5">
            <h1 className="font-['Unbounded'] font-bold text-white text-sm tracking-[0.08em]">
              NOTIFICATIONS
            </h1>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="font-['Outfit'] font-bold text-[10px] text-white bg-[#E63946] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="font-['DM_Sans'] text-xs transition-colors"
              style={{
                color: unreadCount > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              }}
            >
              Mark all read
            </button>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="font-['DM_Sans'] text-xs text-white/30 hover:text-[#E63946] transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[375px] md:max-w-[640px] mx-auto">

        {/* Empty state */}
        <AnimatePresence>
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-32 px-8"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} strokeWidth={1.5} className="text-white/20" />
              </div>
              <p className="font-['Outfit'] font-semibold text-white/30 text-sm mb-1">
                You're all caught up
              </p>
              <p className="font-['DM_Sans'] text-white/20 text-xs text-center">
                No notifications to show
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread section */}
        {unread.length > 0 && (
          <div>
            <div className="px-5 py-3 flex items-center gap-2">
              <span className="font-['DM_Sans'] text-white/25 text-[10px] uppercase tracking-[0.15em]">
                New
              </span>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <AnimatePresence initial={false}>
              {unread.map((n, i) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { duration: 0.22, ease: "easeInOut" },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <NotificationRow
                    notification={n}
                    onDismiss={dismiss}
                    canSwipe={canSwipe}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Read section */}
        {read.length > 0 && (
          <div>
            <div className="px-5 py-3 flex items-center gap-2">
              <span className="font-['DM_Sans'] text-white/25 text-[10px] uppercase tracking-[0.15em]">
                Earlier
              </span>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <AnimatePresence initial={false}>
              {read.map((n, i) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: (unread.length + i) * 0.04 },
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { duration: 0.22, ease: "easeInOut" },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <NotificationRow
                    notification={n}
                    onDismiss={dismiss}
                    canSwipe={canSwipe}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
