// DMThreadScreen — individual DM conversation
// Route: /dm/:threadId
//
// Part 2b — interactions layer:
//   ✅ Long-press action menu (emoji row + Reply + Copy + Delete)
//   ✅ Swipe-to-reply gesture (mobile touch only — desktop uses long-press + menu)
//   ✅ Inline reply threading (reply chip + quoted preview)
//   ✅ Reactions rendering (emoji pills)
//   ✅ Per-thread mute persistence to localStorage
//
// Part 2c TODO list:
//   - Attachment menu (paperclip button stays no-op)
//   - Free-tier message counter check before send
//   - Global quota-exhausted lock UI

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { TOKENS, AGENTS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { DM_THREADS, DM_MESSAGES, type DMMessage, type MessageStatus } from '@/lib/mock-data';
import { isThreadMuted, setThreadMuted } from '@/lib/dm-preferences';

const FONT = 'Inter, system-ui, sans-serif';
const MONO = 'ui-monospace, monospace';

// Six emoji for the reaction quick-row
const REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '😮', '😢'] as const;

const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${TOKENS.line}`,
  borderRadius: 999,
  width: 36,
  height: 36,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: TOKENS.text,
  flexShrink: 0,
};

// ── Me-bubble gradient table (per agent) ─────────────────────────────────────
const ME_BUBBLE_GRADIENTS: Record<string, string> = {
  BARON:   'linear-gradient(135deg, #F26E78 0%, #E63946 50%, #8C1F28 100%)',
  BLITZ:   'linear-gradient(135deg, #F9C99C 0%, #F4A261 50%, #A66732 100%)',
  CIRCUIT: 'linear-gradient(135deg, #7BA5C1 0%, #457B9D 50%, #2A4D62 100%)',
  REEL:    'linear-gradient(135deg, #F4DB9A 0%, #E9C46A 50%, #8F7A3D 100%)',
  PULSE:   'linear-gradient(135deg, #5CC0B4 0%, #2A9D8F 50%, #1A5E56 100%)',
  ATLAS:   'linear-gradient(135deg, #9CA4AB 0%, #6C757D 50%, #42474B 100%)',
};
const GOLD_ME_GRADIENT = 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)';

// ── Agent reply bank ──────────────────────────────────────────────────────────
const AGENT_REPLIES: Record<string, string[]> = {
  BARON:   ['Makes sense. Watch the spread.', 'Heard. Let me look at options.', 'Add on confirmation, not anticipation.'],
  BLITZ:   ['Interesting read. Sunday tells us.', 'Watch the halftime line.', "I'd wait for the injury report."],
  CIRCUIT: ['The pricing page update tonight might matter.', "Noted. I'll track the commit history.", 'Check the GitHub activity first.'],
  REEL:    ['Premiere list updates Friday.', 'Not yet. Wait for the drop.', 'Theater or streaming? Different calls.'],
  PULSE:   ['Recover first, measure second.', 'Zone 2 first, intensity later.', 'Sleep debt is real.'],
  ATLAS:   ["Watch Tuesday's debate.", 'Polls tighten late.', 'Turnout decides this one.'],
};

function generateAgentReply(agentId: string): string {
  const pool = AGENT_REPLIES[agentId] ?? ['Noted.'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024)         return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

// ── useLongPress ──────────────────────────────────────────────────────────────
// Returns pointer-event handlers to spread on any element.
// onTrigger fires after `delay` ms of stationary press (movement > 10px cancels).

function useLongPress(onTrigger: () => void, delay = 500) {
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin  = useRef<{ x: number; y: number } | null>(null);
  const fired   = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    origin.current = null;
    fired.current  = false;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only primary button / first touch
    if (e.button !== undefined && e.button !== 0) return;
    origin.current = { x: e.clientX, y: e.clientY };
    fired.current  = false;
    timer.current  = setTimeout(() => {
      fired.current = true;
      navigator.vibrate?.(10);
      onTrigger();
    }, delay);
  }, [onTrigger, delay]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!origin.current) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) cancel();
  }, [cancel]);

  const onPointerUp   = useCallback(() => cancel(), [cancel]);
  const onPointerLeave = useCallback(() => cancel(), [cancel]);

  // Prevent the native context menu on long-press (mobile Safari)
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    if (fired.current) e.preventDefault();
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onContextMenu };
}

// ── StatusIcon ────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending') {
    return (
      <svg width="9" height="9" viewBox="0 0 14 14" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <path d="M2 7l4 4 6-6" stroke={TOKENS.mute2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      </svg>
    );
  }
  if (status === 'sent') {
    return (
      <svg width="9" height="9" viewBox="0 0 14 14" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <path d="M2 7l4 4 6-6" stroke={TOKENS.mute2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg width="12" height="9" viewBox="0 0 18 14" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <path d="M2 7l4 4 6-6"  stroke={TOKENS.mute2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 7l4 4 6-6"  stroke={TOKENS.mute2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="12" height="9" viewBox="0 0 18 14" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M2 7l4 4 6-6" stroke={TOKENS.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7l4 4 6-6" stroke={TOKENS.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── ActionMenuOverlay ─────────────────────────────────────────────────────────

interface ActionMenuProps {
  msg: DMMessage;
  anchorRect: DOMRect;
  agentColor: string | null;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onClose: () => void;
}

function ActionMenuOverlay({ msg, anchorRect, agentColor: _agentColor, onReact, onReply, onClose }: ActionMenuProps) {
  const MENU_W = 280;
  const isMe   = msg.from === 'me';

  // Horizontal center on bubble, clamped to viewport
  const bubbleCenterX = anchorRect.left + anchorRect.width / 2;
  let left = bubbleCenterX - MENU_W / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));

  // Vertical: below if bubble in upper half, above if in lower half
  const bubbleMidY   = anchorRect.top + anchorRect.height / 2;
  const belowBubble  = bubbleMidY < window.innerHeight / 2;
  const top  = belowBubble ? anchorRect.bottom + 8  : undefined;
  const bottom = belowBubble ? undefined : window.innerHeight - anchorRect.top + 8;

  // Close on outside click or Escape
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onMouse = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouse);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouse);
    };
  }, [onClose]);

  const handleCopy = () => {
    // For attachment messages: copy filename rather than URL
    const copyText = msg.attachment?.name ?? msg.text ?? '';
    navigator.clipboard?.writeText(copyText).catch(() => {/* silent */});
    onClose();
  };

  const actionRowStyle = (danger = false): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    color: danger ? TOKENS.down : TOKENS.text,
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: FONT,
    fontSize: 14,
    transition: 'background 100ms',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      // Backdrop: dim but not fully opaque
      background: 'rgba(0,0,0,0.35)',
    }}>
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: top !== undefined ? top : undefined,
          bottom: bottom !== undefined ? bottom : undefined,
          left,
          width: MENU_W,
          background: TOKENS.bg1,
          border: `1px solid ${TOKENS.line}`,
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          padding: 8,
          animation: 'sl-fade-in 150ms ease both',
          zIndex: 201,
        }}
      >
        {/* Emoji reaction row */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '6px 4px 10px',
          borderBottom: `1px solid ${TOKENS.line}`,
          marginBottom: 4,
        }}>
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onReact(emoji); onClose(); }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, lineHeight: 1,
                transition: 'transform 120ms, background 120ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Reply */}
        <button type="button" style={actionRowStyle()} onClick={() => { onReply(); onClose(); }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 17l-5-5 5-5M4 12h11a5 5 0 010 10h-1"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Reply
        </button>

        {/* Copy */}
        <button type="button" style={actionRowStyle()} onClick={handleCopy}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Copy
        </button>

        {/* Delete — only for 'me' messages */}
        {isMe && (
          <button type="button" style={actionRowStyle(true)} onClick={() => {
            // TODO: real delete pending backend
            onClose();
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,90,95,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── ReplyArrow (swipe indicator) ──────────────────────────────────────────────

function ReplyArrow({ visible, side }: { visible: boolean; side: 'left' | 'right' }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%', transform: 'translateY(-50%)',
      [side]: -28,
      opacity: visible ? 0.85 : 0,
      transition: 'opacity 120ms',
      pointerEvents: 'none',
      color: TOKENS.mute,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        {side === 'left'
          ? <path d="M9 17l-5-5 5-5M4 12h11a5 5 0 010 10h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M15 17l5-5-5-5M20 12H9a5 5 0 000 10h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
    </div>
  );
}

// ── AttachmentBubble ──────────────────────────────────────────────────────────
// Renders inside a message bubble when msg.attachment is present.
// Handles photo display (with imageError fallback) and file chip.

interface AttachmentBubbleProps {
  attachment: NonNullable<DMMessage['attachment']>;
  hasText: boolean;
  isMe: boolean;
}

function AttachmentBubble({ attachment, hasText, isMe }: AttachmentBubbleProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (attachment.url === '#') {
      // TODO: Backend file fetch — mock attachment has no real URL
      console.log('Attachment preview not available in mock');
      return;
    }
    window.open(attachment.url);
  };

  // Photo — render as image; fall through to file chip on error
  if (attachment.type === 'photo' && !imageError) {
    return (
      <img
        src={attachment.url}
        alt={attachment.name ?? 'photo'}
        draggable={false}
        onError={() => setImageError(true)}
        onClick={handleClick}
        style={{
          display: 'block',
          maxWidth: 240,
          maxHeight: 320,
          width: '100%',
          objectFit: 'cover',
          cursor: 'pointer',
          // marginBottom applies spacing before text that follows
          marginBottom: hasText ? 0 : 0,
          // border-radius is provided by parent's overflow:hidden — no border-radius here
        }}
      />
    );
  }

  // File attachment or photo load failure → chip layout
  const name = attachment.name ?? 'file';
  const displayName = name.length > 22 ? name.slice(0, 22) + '…' : name;
  // On me-bubbles (gradient bg) use dark tints; on others use light
  const chipBg    = isMe ? 'rgba(0,0,0,0.14)'            : 'rgba(255,255,255,0.07)';
  const chipText  = isMe ? 'rgba(10,10,10,0.9)'           : TOKENS.text;
  const chipMuted = isMe ? 'rgba(10,10,10,0.55)'          : TOKENS.mute2;

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px', borderRadius: 8,
        background: chipBg,
        marginBottom: hasText ? 6 : 0,
        cursor: 'pointer',
      }}
    >
      {/* File icon */}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        style={{ color: chipMuted, flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <polyline points="14,2 14,8 20,8"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
      <span style={{
        fontFamily: FONT, fontSize: 13, fontWeight: 500,
        color: chipText, flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {displayName}
      </span>
      {attachment.size && (
        <span style={{ fontFamily: MONO, fontSize: 10, color: chipMuted, flexShrink: 0 }}>
          {attachment.size}
        </span>
      )}
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: DMMessage;
  agentColor: string | null;
  agentId: string | null;
  isUserThread: boolean;
  allMsgs: DMMessage[];
  highlighted: boolean;
  onLongPress: (msg: DMMessage, rect: DOMRect) => void;
  onReply: (msg: DMMessage) => void;
  onReact: (msgId: string, emoji: string) => void;
  onScrollTo: (msgId: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

// Swipe threshold (px) to trigger reply
const SWIPE_THRESHOLD = 40;
// Max swipe travel (px) before rubber-banding
const SWIPE_MAX = 60;

function MessageBubble({
  msg, agentColor, agentId, isUserThread,
  allMsgs, highlighted,
  onLongPress, onReply, onReact, onScrollTo, registerRef,
}: MessageBubbleProps) {
  const isMe    = msg.from === 'me';
  const isAgent = msg.from === 'agent';

  // Swipe state (touch only — desktop relies on long-press + menu)
  const [swipeX, setSwipeX]         = useState(0);
  const [snapBack, setSnapBack]     = useState(false);
  const swipeTouchId                = useRef<number | null>(null);
  const swipeOrigin                 = useRef<{ x: number; y: number } | null>(null);
  const swipeAxis                   = useRef<'h' | 'v' | null>(null);
  const swipeThresholdHit           = useRef(false);

  const bubbleDivRef = useRef<HTMLDivElement>(null);

  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    registerRef(msg.id, el);
  }, [msg.id, registerRef]);

  // ── Bubble visuals ─────────────────────────────────────────────────────────
  const bubbleBg = isMe
    ? (agentId && ME_BUBBLE_GRADIENTS[agentId] ? ME_BUBBLE_GRADIENTS[agentId] : GOLD_ME_GRADIENT)
    : isAgent && agentColor
      ? agentColor + '14'
      : isUserThread
        ? 'rgba(212,175,55,0.08)'
        : 'rgba(255,255,255,0.05)';

  const bubbleBorder = isMe
    ? 'none'
    : isAgent
      ? `1px solid ${TOKENS.line}`
      : `1px solid rgba(212,175,55,0.2)`;

  const shadowColor  = agentColor ?? TOKENS.gold;
  const bubbleShadow = [
    'inset 0 1px 0 rgba(255,255,255,0.15)',
    `0 4px 12px ${shadowColor}26`,
  ].join(', ');

  // ── Long-press handlers ───────────────────────────────────────────────────
  const longPressHandlers = useLongPress(() => {
    if (bubbleDivRef.current) {
      onLongPress(msg, bubbleDivRef.current.getBoundingClientRect());
    }
  });

  // ── Swipe-to-reply (touch only) ───────────────────────────────────────────
  // me-bubble: swipe LEFT  (deltaX < 0) → reply
  // other:     swipe RIGHT (deltaX > 0) → reply
  const expectedSign = isMe ? -1 : 1;

  function onTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    swipeTouchId.current  = t.identifier;
    swipeOrigin.current   = { x: t.clientX, y: t.clientY };
    swipeAxis.current     = null;
    swipeThresholdHit.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (swipeTouchId.current === null || !swipeOrigin.current) return;
    const t = Array.from(e.changedTouches).find(x => x.identifier === swipeTouchId.current);
    if (!t) return;

    const dx = t.clientX - swipeOrigin.current.x;
    const dy = t.clientY - swipeOrigin.current.y;

    // Lock axis on first meaningful movement
    if (!swipeAxis.current) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      swipeAxis.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }

    // If vertical scroll wins, abort swipe
    if (swipeAxis.current === 'v') return;

    // Only honor swipe in expected direction
    if (dx * expectedSign <= 0) { setSwipeX(0); return; }

    const travel = Math.abs(dx);
    // Rubber-band beyond SWIPE_MAX
    const clamped = travel <= SWIPE_MAX
      ? travel
      : SWIPE_MAX + (travel - SWIPE_MAX) * 0.25;
    setSwipeX(clamped * expectedSign);

    // Haptic on crossing threshold (once per gesture)
    if (travel >= SWIPE_THRESHOLD && !swipeThresholdHit.current) {
      swipeThresholdHit.current = true;
      navigator.vibrate?.(8);
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (swipeTouchId.current === null) return;
    const t = Array.from(e.changedTouches).find(x => x.identifier === swipeTouchId.current);
    if (!t || !swipeOrigin.current) { resetSwipe(); return; }

    const travel = Math.abs(t.clientX - swipeOrigin.current.x);
    if (swipeAxis.current === 'h' && travel >= SWIPE_THRESHOLD) {
      onReply(msg);
    }
    resetSwipe();
  }

  function resetSwipe() {
    swipeTouchId.current  = null;
    swipeOrigin.current   = null;
    swipeAxis.current     = null;
    swipeThresholdHit.current = false;
    setSnapBack(true);
    setSwipeX(0);
    // Remove snapBack class after animation completes
    setTimeout(() => setSnapBack(false), 300);
  }

  // ── Reply-to preview ───────────────────────────────────────────────────────
  const repliedMsg = msg.replyTo ? allMsgs.find(m => m.id === msg.replyTo) : null;
  const replyBorderColor = repliedMsg
    ? repliedMsg.from === 'me'
      ? TOKENS.gold
      : repliedMsg.from === 'agent'
        ? (agentColor ?? TOKENS.gold)
        : TOKENS.gold
    : TOKENS.gold;
  const repliedSenderName = repliedMsg
    ? repliedMsg.from === 'me'
      ? 'You'
      : repliedMsg.from === 'agent'
        ? (agentId ? ((AGENTS as Record<string, typeof AGENTS[keyof typeof AGENTS]>)[agentId]?.name ?? 'Agent') : 'Agent')
        : 'User'
    : '';

  // ── Attachment layout helpers ─────────────────────────────────────────────
  const att          = msg.attachment ?? null;
  const isPhotoOnly  = att?.type === 'photo' && !msg.text;
  const hasAtt       = att !== null;

  // ── Reactions grouped ─────────────────────────────────────────────────────
  const reactionGroups = (msg.reactions ?? []).reduce<Map<string, { count: number; byMe: boolean }>>(
    (acc, r) => {
      const entry = acc.get(r.emoji) ?? { count: 0, byMe: false };
      entry.count++;
      if (r.from === 'me') entry.byMe = true;
      acc.set(r.emoji, entry);
      return acc;
    },
    new Map()
  );

  const showReplyArrow = Math.abs(swipeX) > 8;

  return (
    <div
      ref={wrapRef}
      style={{
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        animation: 'sl-fade-in 300ms ease both',
        position: 'relative',
        // Highlight flash
        borderRadius: 16,
        ...(highlighted ? { animation: 'sl-msg-highlight 600ms ease forwards' } : {}),
      }}
    >
      {/* Reply-to preview above the bubble */}
      {repliedMsg && (
        <div
          onClick={() => onScrollTo(repliedMsg.id)}
          style={{
            width: '85%',
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            marginLeft: isMe ? 'auto' : undefined,
            background: 'rgba(255,255,255,0.03)',
            borderLeft: `3px solid ${replyBorderColor}`,
            borderRadius: 8,
            padding: '6px 10px',
            marginBottom: 2,
            cursor: 'pointer',
          }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: 1.2,
            color: replyBorderColor, marginBottom: 2,
          }}>
            {repliedSenderName.toUpperCase()}
          </div>
          <div style={{
            fontFamily: FONT, fontSize: 11, color: TOKENS.mute,
            fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {(repliedMsg.text ?? '').slice(0, 60)}{(repliedMsg.text ?? '').length > 60 ? '…' : ''}
          </div>
        </div>
      )}

      {/* Bubble (translates during swipe) */}
      <div
        ref={bubbleDivRef}
        style={{
          position: 'relative',
          transform: `translateX(${swipeX}px)`,
          transition: snapBack ? 'transform 280ms cubic-bezier(0.25,1,0.5,1)' : 'none',
          userSelect: 'none', // prevent text selection during long-press
        }}
        // Long-press
        {...longPressHandlers}
        // Swipe (touch only — comment: desktop skips swipe gesture, uses long-press + menu)
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => resetSwipe()}
      >
        {/* Reply arrow indicator */}
        <ReplyArrow visible={showReplyArrow} side={isMe ? 'right' : 'left'} />

        <div style={{
          // Photo-only: transparent shell — photo is clipped to border-radius via overflow:hidden
          // Photo+text or file: normal bubble appearance
          padding: hasAtt && att!.type === 'photo' ? '0' : '10px 14px',
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isPhotoOnly ? 'transparent' : bubbleBg,
          color: isMe ? '#0A0A0A' : TOKENS.text,
          border: isPhotoOnly ? 'none' : bubbleBorder,
          fontFamily: FONT, fontSize: 14, lineHeight: 1.45,
          boxShadow: isPhotoOnly ? 'none' : bubbleShadow,
          // overflow:hidden lets border-radius clip the photo to the bubble shape
          overflow: hasAtt && att!.type === 'photo' ? 'hidden' : 'visible',
        }}>
          {/* Attachment — renders above text when both present */}
          {att && <AttachmentBubble attachment={att} hasText={!!msg.text} isMe={isMe} />}

          {/* Text — photo+text gets extra padding since photo has none */}
          {msg.text ? (
            att?.type === 'photo'
              ? <div style={{ padding: '6px 14px 10px', lineHeight: 1.45 }}>{msg.text}</div>
              : msg.text
          ) : null}
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        fontFamily: MONO, fontSize: 9, color: TOKENS.mute3,
        marginTop: 3,
        textAlign: isMe ? 'right' : 'left',
        paddingRight: isMe ? 4 : 0,
        paddingLeft:  isMe ? 0 : 4,
        display: 'flex', alignItems: 'center', gap: 3,
        justifyContent: isMe ? 'flex-end' : 'flex-start',
      }}>
        {msg.time}
        {isMe && msg.status && <StatusIcon status={msg.status} />}
      </div>

      {/* Reactions row */}
      {reactionGroups.size > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4,
          marginTop: 3,
          justifyContent: isMe ? 'flex-end' : 'flex-start',
        }}>
          {Array.from(reactionGroups.entries()).map(([emoji, { count, byMe }]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(msg.id, emoji)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px',
                borderRadius: 999,
                background: byMe ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.06)',
                border: byMe ? `1px solid ${TOKENS.gold}` : `1px solid ${TOKENS.line}`,
                cursor: 'pointer',
                fontFamily: FONT, fontSize: 14, lineHeight: 1,
              }}
            >
              <span style={{ fontSize: 14 }}>{emoji}</span>
              {count > 1 && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: TOKENS.mute2 }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MenuItem (header dropdown) ────────────────────────────────────────────────

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        width: '100%', height: 36, padding: '8px 12px',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: 'none', borderRadius: 6,
        cursor: 'pointer', textAlign: 'left',
        fontFamily: FONT, fontSize: 13,
        color: danger ? TOKENS.down : TOKENS.text,
        transition: 'background 100ms',
      }}
    >
      {label}
    </button>
  );
}

// ── DMThreadScreen ────────────────────────────────────────────────────────────

// Agent quota constants
const AGENT_QUOTA = 10;
// Counter starts showing when this many sends remain (inclusive)
const QUOTA_WARN_THRESHOLD = 3;
// User-thread turn-taking limit (applies to all users — it's UX pacing, not a tier gate)
const USER_TURN_LIMIT = 2;

export function DMThreadScreen() {
  const navigate   = useNavigate();
  const { threadId = '' } = useParams();

  const thread = DM_THREADS.find(t => t.id === threadId) ?? null;
  if (!thread) return <Navigate to="/dms" replace />;

  const isAgentThread = thread.kind === 'agent';
  const isUserThread  = !isAgentThread;
  const A             = thread.agent ? AGENTS[thread.agent] : null;
  const displayName   = A ? A.name : `@${thread.userHandle ?? ''}`;

  const agentColor        = isAgentThread && A ? A.color : null;
  const headerBorderColor = agentColor ? agentColor + '33' : TOKENS.gold + '33';
  const ambientGradient   = agentColor ? agentColor + '0D' : 'rgba(212,175,55,0.05)';
  const accentColor       = agentColor ?? TOKENS.gold;

  // Read once at render-time — premium flag is stable per page load
  const isPremium = localStorage.getItem('sl-premium') === '1';

  // ── Quota keys ─────────────────────────────────────────────────────────────
  // Agent quota: per-agent count of messages sent by free users.
  // sl-dm-count-{AGENT_ID}
  const agentQuotaKey = isAgentThread && thread.agent ? `sl-dm-count-${thread.agent}` : '';
  // User-thread wait count: consecutive 'me' messages sent in this user thread.
  // Persisted so reload reflects the same state.
  // sl-dm-wait-{threadId}
  const userWaitKey   = isUserThread ? `sl-dm-wait-${threadId}` : '';

  // ── State ──────────────────────────────────────────────────────────────────
  const [msgs, setMsgs]         = useState<DMMessage[]>(DM_MESSAGES[threadId] ?? []);
  const [text, setText]         = useState('');
  const [typing, setTyping]     = useState(false);
  const [muted, setMuted]       = useState(() => isThreadMuted(threadId, thread.muted));
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo]   = useState<DMMessage | null>(null);
  const [actionMenu, setActionMenu]   = useState<{ msg: DMMessage; rect: DOMRect } | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Fix 1: agent-pending tracks the window between user sending and agent reply arriving
  const [agentPending, setAgentPending] = useState(false);

  // Part 2c: pending attachment before send
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: 'photo' | 'file'; name: string; url: string; size: string; isLarge: boolean;
  } | null>(null);
  const [plusHovered, setPlusHovered] = useState(false);

  // Fix 2: free-user quota counter for agent threads
  const [sentCount, setSentCount] = useState<number>(() => {
    if (!isAgentThread || !agentQuotaKey || isPremium) return 0;
    return parseInt(localStorage.getItem(agentQuotaKey) ?? '0', 10);
  });

  // Fix 3 (user threads): persisted consecutive 'me' message count for turn-taking
  const [consecutiveMeCount, setConsecutiveMeCount] = useState<number>(() => {
    if (!isUserThread || !userWaitKey) return 0;
    // Cap at USER_TURN_LIMIT so we don't need to reason about higher values
    return Math.min(parseInt(localStorage.getItem(userWaitKey) ?? '0', 10), USER_TURN_LIMIT);
  });

  // ── Derived composer states ────────────────────────────────────────────────
  // remaining: how many free sends left (only relevant for free agent-thread users)
  const remaining      = AGENT_QUOTA - sentCount;
  // Quota exhausted: free + agent thread + no sends left
  const quotaExhausted = !isPremium && isAgentThread && remaining <= 0;
  // Show counter only when within the warn threshold and not yet exhausted
  const showCounter    = !isPremium && isAgentThread && !quotaExhausted && remaining <= QUOTA_WARN_THRESHOLD;
  // User-thread turn-taking: show "waiting" when consecutive me-count hits limit
  const waitingForReply = isUserThread && consecutiveMeCount >= USER_TURN_LIMIT;
  // Composer is fully locked (no input allowed)
  const composerLocked = quotaExhausted || waitingForReply;
  // Send is valid when there's text OR a pending attachment (premium only for attachment)
  const canSend = !!(text.trim() || pendingAttachment) && !waitingForReply;
  // + button color: locked/dim for free users; gold on hover when premium and active
  const plusColor = !isPremium
    ? (quotaExhausted ? TOKENS.mute3 : TOKENS.mute)
    : agentPending || composerLocked
      ? TOKENS.mute2
      : plusHovered ? TOKENS.gold : TOKENS.mute;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  // Cancellable timers for agent typing + reply
  const pendingTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingReplyTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Message element map for scroll-to-original
  const msgRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // File picker ref (hidden input)
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks the object URL of a pending attachment so we can revoke it on remove/unmount
  // Cleared to null after send (URL still needed for the bubble renderer)
  const pendingAttachmentUrlRef = useRef<string | null>(null);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) msgRefs.current.set(id, el);
    else    msgRefs.current.delete(id);
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length, typing, replyingTo]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Cleanup timers and any unsent attachment blob URL on unmount
  useEffect(() => {
    return () => {
      if (pendingTypingTimer.current)    clearTimeout(pendingTypingTimer.current);
      if (pendingReplyTimer.current)     clearTimeout(pendingReplyTimer.current);
      if (pendingAttachmentUrlRef.current) URL.revokeObjectURL(pendingAttachmentUrlRef.current);
    };
  }, []);

  // ── Fix 1: Stop reply ──────────────────────────────────────────────────────
  // Cancels both pending timers, clears typing indicator, re-enables composer.
  const stopReply = useCallback(() => {
    if (pendingTypingTimer.current) { clearTimeout(pendingTypingTimer.current); pendingTypingTimer.current = null; }
    if (pendingReplyTimer.current)  { clearTimeout(pendingReplyTimer.current);  pendingReplyTimer.current  = null; }
    setTyping(false);
    setAgentPending(false);
  }, []);

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = () => {
    setMuted(m => {
      const next = !m;
      setThreadMuted(threadId, next);
      return next;
    });
    setShowMenu(false);
  };

  // ── Action menu callbacks ──────────────────────────────────────────────────
  const handleLongPress = useCallback((msg: DMMessage, rect: DOMRect) => {
    setActionMenu({ msg, rect });
  }, []);

  const handleMenuReact = (emoji: string) => {
    if (!actionMenu) return;
    applyReaction(actionMenu.msg.id, emoji);
  };

  // ── Reaction toggle ────────────────────────────────────────────────────────
  function applyReaction(msgId: string, emoji: string) {
    setMsgs(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = m.reactions ?? [];
      const alreadyReacted = reactions.some(r => r.emoji === emoji && r.from === 'me');
      const next = alreadyReacted
        ? reactions.filter(r => !(r.emoji === emoji && r.from === 'me'))
        : [...reactions, { emoji, from: 'me' as const }];
      return { ...m, reactions: next };
    }));
  }

  // ── Scroll-to-original with highlight flash ────────────────────────────────
  const handleScrollTo = useCallback((msgId: string) => {
    const el = msgRefs.current.get(msgId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(msgId);
    setTimeout(() => setHighlightedId(null), 700);
  }, []);

  // ── Part 2c: attachment handlers ──────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous unsent attachment URL before creating a new one
    if (pendingAttachmentUrlRef.current) URL.revokeObjectURL(pendingAttachmentUrlRef.current);
    const url = URL.createObjectURL(file);
    pendingAttachmentUrlRef.current = url;
    setPendingAttachment({
      type: file.type.startsWith('image/') ? 'photo' : 'file',
      name: file.name,
      url,
      size: formatFileSize(file.size),
      isLarge: file.size > 10 * 1024 * 1024,
    });
    // Reset so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    if (pendingAttachmentUrlRef.current) {
      URL.revokeObjectURL(pendingAttachmentUrlRef.current);
      pendingAttachmentUrlRef.current = null;
    }
    setPendingAttachment(null);
  };

  const handlePlusClick = () => {
    if (!isPremium) {
      // TODO: Post-backend: pass attachment intent so paywall shows 'Unlock attachments'
      navigate('/paywall');
      return;
    }
    // No-op while agent is composing or composer is locked
    if (agentPending || composerLocked) return;
    fileInputRef.current?.click();
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = () => {
    const hasContent = !!(text.trim() || pendingAttachment);
    if (!hasContent || composerLocked || agentPending) return;

    const msgId  = 'm' + Date.now();
    const newMsg: DMMessage = {
      id: msgId, from: 'me', time: 'now', status: 'sending',
      ...(text.trim()        ? { text: text.trim() }                                                    : {}),
      ...(replyingTo         ? { replyTo: replyingTo.id }                                               : {}),
      ...(pendingAttachment  ? { attachment: {
          type: pendingAttachment.type,
          name: pendingAttachment.name,
          url:  pendingAttachment.url,
          size: pendingAttachment.size,
        }} : {}),
    };
    setMsgs(m => [...m, newMsg]);
    setText('');
    setReplyingTo(null);
    setPendingAttachment(null);
    // Don't revoke the blob URL — the bubble renderer still needs it.
    // Clear the ref so unmount cleanup doesn't revoke it either.
    pendingAttachmentUrlRef.current = null;

    // Status progression
    setTimeout(() => setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, status: 'sent' }      : msg)), 300);
    setTimeout(() => setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, status: 'delivered' } : msg)), 900);
    setTimeout(() => setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, status: 'read' }      : msg)), 2000);

    // Fix 2: increment quota counter for free users on agent threads
    if (!isPremium && isAgentThread && agentQuotaKey) {
      const next = sentCount + 1;
      setSentCount(next);
      localStorage.setItem(agentQuotaKey, String(next));
    }

    // Fix 3: increment consecutive-me counter for user threads
    if (isUserThread && userWaitKey) {
      const next = Math.min(consecutiveMeCount + 1, USER_TURN_LIMIT);
      setConsecutiveMeCount(next);
      localStorage.setItem(userWaitKey, String(next));
    }

    // Fix 1: agent auto-reply with cancellable timers (agent threads only)
    if (isAgentThread && thread.agent) {
      const agentId = thread.agent;
      setAgentPending(true);
      pendingTypingTimer.current = setTimeout(() => {
        setTyping(true);
        pendingTypingTimer.current = null;
      }, 500);
      pendingReplyTimer.current = setTimeout(() => {
        setTyping(false);
        setAgentPending(false);
        pendingReplyTimer.current = null;
        setMsgs(m => [...m, {
          id: 'reply' + Date.now(),
          from: 'agent',
          text: generateAgentReply(agentId),
          time: 'now',
        }]);
      }, 2200);
    }
  };

  // ── Subtitle for thread header ────────────────────────────────────────────
  const subtitleColor = A ? A.color : TOKENS.gold;
  const subtitleText  = isAgentThread
    ? (thread.online ? `ONLINE · ${A!.tag.toUpperCase()}` : A!.tag.toUpperCase())
    : (thread.online ? 'ONLINE' : 'LAST SEEN · 2H AGO');

  // ── Shared button styles ───────────────────────────────────────────────────
  // Re-used for send / stop / lock buttons (same 34×34 circular shape)
  const sendBtnBase: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 200ms',
  };
  const goldBtnStyle: React.CSSProperties = {
    ...sendBtnBase,
    background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
    color: '#0A0A0A',
    boxShadow: '0 4px 12px rgba(212,175,55,0.35)',
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>

      {/* ── Action menu overlay ──────────────────────────────────────────── */}
      {actionMenu && (
        <ActionMenuOverlay
          msg={actionMenu.msg}
          anchorRect={actionMenu.rect}
          agentColor={agentColor}
          onReact={handleMenuReact}
          onReply={() => setReplyingTo(actionMenu.msg)}
          onClose={() => setActionMenu(null)}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(6px + var(--ic-top-inset,0px)) 18px 10px',
        borderBottom: `1px solid ${headerBorderColor}`,
        flexShrink: 0,
        position: 'relative',
      }}>
        <button type="button" onClick={() => navigate(-1)} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          {A ? (
            <AgentDot agent={thread.agent!} size={32} clickable={false} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2a2a2a, #121212)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT, fontWeight: 700, fontSize: 13, color: TOKENS.text,
              border: `1px solid ${TOKENS.line2}`,
            }}>
              {thread.userInitials}
            </div>
          )}
          {thread.online && (
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 6, height: 6, borderRadius: '50%',
              background: '#2A9D8F',
              border: `2px solid ${TOKENS.bg}`,
            }} />
          )}
        </div>

        <div style={{ flex: 1, lineHeight: 1.1 }}>
          {/* Part 2b: other entry points (DM list, Notifications, Post author, Arenas, Explore) */}
          {isUserThread ? (
            // User threads: tap name → /profile/:handle
            <button
              type="button"
              onClick={() => navigate('/profile/' + thread.userHandle)}
              style={{
                fontFamily: FONT, fontSize: 14, fontWeight: 600, color: TOKENS.text,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'block', textAlign: 'left',
              }}
            >
              {displayName}
            </button>
          ) : (
            // Agent threads: static — agents have no /profile/:handle page
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>{displayName}</div>
          )}
          <div style={{
            fontFamily: MONO, fontSize: 9.5, color: subtitleColor,
            letterSpacing: 1.2, marginTop: 3,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {thread.online && (
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: subtitleColor,
                animation: 'ic-pulse 1.6s ease-out infinite',
                flexShrink: 0,
              }} />
            )}
            {subtitleText}
          </div>
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button type="button" onClick={() => setShowMenu(v => !v)} style={iconBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="5"  cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: TOKENS.bg1,
              border: `1px solid ${TOKENS.line}`,
              borderRadius: 10, padding: 6, minWidth: 180, zIndex: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              <MenuItem
                label={muted ? 'Unmute notifications' : 'Mute notifications'}
                onClick={toggleMute}
              />
              <MenuItem
                label="View profile"
                onClick={() => setShowMenu(false)}
                // TODO: navigate to /profile/:handle
              />
              <MenuItem
                label="Block"
                onClick={() => setShowMenu(false)}
                // TODO: call block endpoint
                danger
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div
          aria-hidden
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 200,
            background: `linear-gradient(180deg, ${ambientGradient} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{
            position: 'absolute', inset: 0,
            overflowY: 'auto',
            padding: '16px 20px 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          {msgs.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              agentColor={agentColor}
              agentId={thread.agent ?? null}
              isUserThread={isUserThread}
              allMsgs={msgs}
              highlighted={highlightedId === msg.id}
              onLongPress={handleLongPress}
              onReply={setReplyingTo}
              onReact={applyReaction}
              onScrollTo={handleScrollTo}
              registerRef={registerRef}
            />
          ))}

          {/* Typing indicator */}
          {typing && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '12px 14px',
              borderRadius: '16px 16px 16px 4px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${TOKENS.line}`,
              display: 'flex', gap: 4,
              animation: 'sl-fade-in 300ms ease both',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: TOKENS.mute,
                  display: 'block',
                  animation: `sl-typing 1.2s ease-in-out ${i * 180}ms infinite`,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reply chip ────────────────────────────────────────────────────── */}
      {replyingTo && (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderTop: `1px solid ${TOKENS.line}`,
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: 1.4,
              color: accentColor, marginBottom: 2,
            }}>
              REPLYING TO {replyingTo.from === 'me' ? 'YOU' : replyingTo.from === 'agent' ? (A?.name ?? 'AGENT').toUpperCase() : 'USER'}
            </div>
            <div style={{
              fontFamily: FONT, fontSize: 12, color: TOKENS.mute,
              fontStyle: 'italic',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {replyingTo.text}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: TOKENS.mute2, flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Composer wrapper ───────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(10,10,10,0.95)',
        borderTop: `1px solid ${TOKENS.line}`,
        flexShrink: 0,
      }}>
        {/* Quota counter (free agent threads, 1-3 remaining) */}
        {showCounter && (
          <div style={{ padding: '5px 18px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: 1.2,
              color: remaining === 1 ? TOKENS.down : TOKENS.mute2,
            }}>
              {remaining} of {AGENT_QUOTA} remaining
            </span>
          </div>
        )}

        {/* User-thread waiting label */}
        {waitingForReply && (
          <div style={{ padding: '5px 18px 0', display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2 }}>
              WAITING FOR REPLY
            </span>
          </div>
        )}

        {/* Pending attachment preview — photo thumbnail or file chip */}
        {pendingAttachment && (
          <div style={{ padding: '8px 14px 0' }}>
            {pendingAttachment.type === 'photo' ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={pendingAttachment.url}
                  alt={pendingAttachment.name}
                  style={{
                    width: 64, height: 64, objectFit: 'cover',
                    borderRadius: 8, display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 9, lineHeight: 1,
                  }}
                >✕</button>
                {pendingAttachment.isLarge && (
                  <div style={{
                    marginTop: 3, fontFamily: MONO, fontSize: 9,
                    color: TOKENS.down, letterSpacing: 0.8,
                  }}>
                    ⚠ Large file — may fail
                  </div>
                )}
              </div>
            ) : (
              /* File chip preview */
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 10, padding: 8,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  style={{ color: TOKENS.mute, flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8"
                    stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
                <span style={{
                  fontFamily: FONT, fontSize: 13, color: TOKENS.text, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {pendingAttachment.name.length > 28
                    ? pendingAttachment.name.slice(0, 28) + '…'
                    : pendingAttachment.name}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: TOKENS.mute2, flexShrink: 0 }}>
                  {pendingAttachment.size}
                </span>
                {pendingAttachment.isLarge && (
                  <span style={{ fontFamily: MONO, fontSize: 9, color: TOKENS.down }}>⚠</span>
                )}
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: TOKENS.mute2, flexShrink: 0, fontSize: 10,
                  }}
                >✕</button>
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: TOKENS.bg2,
          border: `1px solid ${TOKENS.line2}`,
          borderRadius: 999,
          padding: '8px 8px 8px 14px',
          margin: `10px 14px calc(4px + var(--ic-bot-inset,0px))`,
        }}>
          {/* + (attachment) button — replaces paperclip */}
          <button
            type="button"
            onClick={handlePlusClick}
            onMouseEnter={() => setPlusHovered(true)}
            onMouseLeave={() => setPlusHovered(false)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'transparent', border: 'none',
              cursor: 'pointer', color: plusColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'color 150ms',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5"  y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          {/* Hidden native file picker — triggered by + button for premium users */}
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Text input */}
          <input
            ref={inputRef}
            value={text}
            onChange={e => !composerLocked && setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !composerLocked && send()}
            readOnly={composerLocked}
            placeholder={
              quotaExhausted  ? 'Upgrade to Inner Circle to continue' :
              waitingForReply ? 'Waiting for reply...' :
              `Message ${displayName}…`
            }
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: FONT, fontSize: 14, minWidth: 0,
              color: composerLocked ? TOKENS.mute2 : TOKENS.text,
              background: 'none',
              cursor: composerLocked ? 'not-allowed' : 'text',
            }}
          />

          {/* ── Send / Stop / Lock button ── */}
          {agentPending ? (
            // Stop button — cancels pending agent reply
            <button type="button" onClick={stopReply} style={goldBtnStyle}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="0.5" y="0.5" width="12" height="12" rx="3" fill="currentColor"/>
              </svg>
            </button>
          ) : quotaExhausted ? (
            // Lock button — navigates to paywall
            <button type="button" onClick={() => navigate('/paywall')} style={goldBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          ) : (
            // Normal send button — active when text OR attachment present
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              style={{
                ...sendBtnBase,
                cursor: canSend ? 'pointer' : 'default',
                background: canSend
                  ? 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)'
                  : 'rgba(255,255,255,0.08)',
                color: canSend ? '#0A0A0A' : TOKENS.mute2,
                boxShadow: canSend ? '0 4px 12px rgba(212,175,55,0.35)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
