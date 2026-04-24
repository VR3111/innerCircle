// DMThreadScreen — individual DM conversation
// Route: /dm/:threadId
//
// Part 2 TODO list:
//   - Attachment menu (paperclip button is rendered but non-functional)
//   - Long-press message to open reaction / reply / copy sheet
//   - Swipe-left on a message to trigger reply-to
//   - Render replyTo preview above bubble when present
//   - Render reaction row below bubble when present
//   - Free-tier message counter check before send
//   - Global lock UI when monthly quota hit
//   - Persist mute preference to backend
//   - "View profile" menu item should navigate to /profile/:handle
//   - "Block" menu item should call backend block endpoint

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { TOKENS, AGENTS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { DM_THREADS, DM_MESSAGES, type DMMessage, type MessageStatus } from '@/lib/mock-data';

const FONT = 'Inter, system-ui, sans-serif';
const MONO = 'ui-monospace, monospace';

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
// Each gradient uses: light variant → agent base color → dark variant.
// Hardcoded per agent — predictable colors, no runtime computation needed.
// Text is always #0A0A0A: the gradient's light stop at the top-left corner
// ensures readable contrast (all light stops pass WCAG AA against near-black).

const ME_BUBBLE_GRADIENTS: Record<string, string> = {
  BARON:   'linear-gradient(135deg, #F26E78 0%, #E63946 50%, #8C1F28 100%)',
  BLITZ:   'linear-gradient(135deg, #F9C99C 0%, #F4A261 50%, #A66732 100%)',
  CIRCUIT: 'linear-gradient(135deg, #7BA5C1 0%, #457B9D 50%, #2A4D62 100%)',
  REEL:    'linear-gradient(135deg, #F4DB9A 0%, #E9C46A 50%, #8F7A3D 100%)',
  PULSE:   'linear-gradient(135deg, #5CC0B4 0%, #2A9D8F 50%, #1A5E56 100%)',
  ATLAS:   'linear-gradient(135deg, #9CA4AB 0%, #6C757D 50%, #42474B 100%)',
};

// Gold gradient for me-bubbles in user (IC) threads — user identity is gold-tier
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
  // read — double check gold
  return (
    <svg width="12" height="9" viewBox="0 0 18 14" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M2 7l4 4 6-6" stroke={TOKENS.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7l4 4 6-6" stroke={TOKENS.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── DMThreadScreen ────────────────────────────────────────────────────────────

export function DMThreadScreen() {
  const navigate = useNavigate();
  const { threadId = '' } = useParams();

  const thread = DM_THREADS.find(t => t.id === threadId) ?? null;

  // Guard: unknown threadId → back to list
  if (!thread) return <Navigate to="/dms" replace />;

  const isAgentThread = thread.kind === 'agent';
  const A = thread.agent ? AGENTS[thread.agent] : null;
  const displayName = A ? A.name : `@${thread.userHandle ?? ''}`;

  // Per-thread color theming derived from agent color or gold for IC user threads
  const agentColor        = isAgentThread && A ? A.color : null;
  const headerBorderColor = agentColor ? agentColor + '33' : TOKENS.gold + '33'; // hex 33 ≈ 20% opacity
  const ambientGradient   = agentColor ? agentColor + '0D' : 'rgba(212,175,55,0.05)'; // 0D ≈ 5% opacity

  // Premium flag — read once; used for Part 2 free-tier gating
  const isPremium = localStorage.getItem('sl-premium') === '1';
  void isPremium; // TODO: Part 2 — free-tier message counter check before send

  const [msgs, setMsgs]       = useState<DMMessage[]>(DM_MESSAGES[threadId] ?? []);
  const [text, setText]       = useState('');
  const [typing, setTyping]   = useState(false);
  const [muted, setMuted]     = useState(thread.muted);
  const [showMenu, setShowMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs.length, typing]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = () => {
    if (!text.trim()) return;
    // TODO: Part 2 adds free-tier message counter check before send
    const msgId  = 'm' + Date.now();
    const newMsg: DMMessage = {
      id: msgId, from: 'me', text: text.trim(), time: 'now', status: 'sending',
    };
    setMsgs(m => [...m, newMsg]);
    setText('');

    // Fake status progression
    setTimeout(() => setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, status: 'sent' }      : msg)), 300);
    setTimeout(() => setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, status: 'delivered' } : msg)), 900);
    setTimeout(() => setMsgs(m => m.map(msg => msg.id === msgId ? { ...msg, status: 'read' }      : msg)), 2000);

    // Agent auto-reply
    if (isAgentThread && thread.agent) {
      const agentId = thread.agent;
      setTimeout(() => setTyping(true), 500);
      setTimeout(() => {
        setTyping(false);
        setMsgs(m => [...m, {
          id: 'reply' + Date.now(),
          from: 'agent',
          text: generateAgentReply(agentId),
          time: 'now',
        }]);
      }, 2200);
    }
    // User thread: no auto-reply (silent for now — Part 2 will not add auto-reply either)
  };

  // ── Subtitle for thread header ────────────────────────────────────────────
  const subtitleColor = A ? A.color : TOKENS.gold;
  const subtitleText  = isAgentThread
    ? (thread.online ? `ONLINE · ${A!.tag.toUpperCase()}` : A!.tag.toUpperCase())
    : (thread.online ? 'ONLINE' : 'LAST SEEN · 2H AGO');

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(16px + var(--ic-top-inset,0px)) 18px 10px',
        borderBottom: `1px solid ${headerBorderColor}`,
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Back */}
        <button type="button" onClick={() => navigate(-1)} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Avatar (32×32) */}
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

        {/* Name + subtitle */}
        <div style={{ flex: 1, lineHeight: 1.1 }}>
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>{displayName}</div>
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

        {/* Three-dot menu button */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(v => !v)}
            style={iconBtnStyle}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="5"  cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </button>

          {/* Dropdown menu */}
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
                onClick={() => { setMuted(m => !m); setShowMenu(false); }}
                // TODO: persist mute state to backend in Part 2
              />
              <MenuItem
                label="View profile"
                onClick={() => setShowMenu(false)}
                // TODO: navigate to /profile/:handle in Part 2
              />
              <MenuItem
                label="Block"
                onClick={() => setShowMenu(false)}
                // TODO: call block endpoint in Part 2
                danger
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────── */}
      {/* TODO Part 2: add long-press handler for reaction / reply / copy sheet */}
      {/* TODO Part 2: add swipe-left handler for reply-to gesture */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Ambient top gradient — non-scrolling, fades out after 200px */}
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
            padding: '16px 16px 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
        {msgs.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            agentColor={agentColor}
            agentId={thread.agent ?? null}
            isUserThread={!isAgentThread}
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
        </div>{/* end scrollable */}
      </div>{/* end messages wrapper */}

      {/* ── Composer ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: `10px 14px calc(16px + var(--ic-bot-inset,0px))`,
        background: 'rgba(10,10,10,0.95)',
        borderTop: `1px solid ${TOKENS.line}`,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: TOKENS.bg2,
          border: `1px solid ${TOKENS.line2}`,
          borderRadius: 999,
          padding: '8px 8px 8px 14px',
        }}>
          {/* TODO Part 2: attachment menu — replace no-op with file picker + attachment type sheet */}
          <button
            type="button"
            onClick={() => { /* TODO Part 2: attachment menu */ }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'transparent', border: 'none',
              cursor: 'pointer', color: TOKENS.mute,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Message ${displayName}…`}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: TOKENS.text, fontFamily: FONT, fontSize: 14, minWidth: 0,
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: 'none', cursor: text.trim() ? 'pointer' : 'default',
              background: text.trim()
                ? 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)'
                : 'rgba(255,255,255,0.08)',
              color: text.trim() ? '#0A0A0A' : TOKENS.mute2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 200ms',
              boxShadow: text.trim() ? '0 4px 12px rgba(212,175,55,0.35)' : 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: DMMessage;
  agentColor: string | null;  // hex color for tint/shadow; null in user threads
  agentId: string | null;     // for me-bubble gradient lookup; null in user threads
  isUserThread: boolean;
}

function MessageBubble({ msg, agentColor, agentId, isUserThread }: MessageBubbleProps) {
  const isMe    = msg.from === 'me';
  const isAgent = msg.from === 'agent';
  // msg.from === 'user' → IC user thread bubble (gold tint)

  // ── Background ──────────────────────────────────────────────────────────────
  const bubbleBg = isMe
    // Me bubble: agent-specific gradient in agent threads, gold in user threads
    ? (agentId && ME_BUBBLE_GRADIENTS[agentId] ? ME_BUBBLE_GRADIENTS[agentId] : GOLD_ME_GRADIENT)
    : isAgent && agentColor
      ? agentColor + '14'           // hex 14 ≈ 8% agent color tint
      : isUserThread
        ? 'rgba(212,175,55,0.08)'   // IC user bubble: subtle gold tint
        : 'rgba(255,255,255,0.05)'; // fallback

  // ── Border: borders only on non-me bubbles ──────────────────────────────────
  const bubbleBorder = isMe
    ? 'none'
    : isAgent
      ? `1px solid ${TOKENS.line}`
      : `1px solid rgba(212,175,55,0.2)`;  // IC user: gold-tinted border

  // ── Gloss shadow ────────────────────────────────────────────────────────────
  // Inset top-edge highlight + colored drop shadow underneath.
  // Shadow color tracks the thread's theme (agent color or gold for user threads).
  const shadowColor = agentColor ?? TOKENS.gold;
  const bubbleShadow = [
    'inset 0 1px 0 rgba(255,255,255,0.15)',   // subtle top-edge specular
    `0 4px 12px ${shadowColor}26`,             // hex 26 ≈ 15% colored drop shadow
  ].join(', ');

  return (
    <div style={{
      alignSelf: isMe ? 'flex-end' : 'flex-start',
      maxWidth: '78%',
      animation: 'sl-fade-in 300ms ease both',
    }}>
      {/* Bubble */}
      <div style={{
        padding: '10px 14px',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: bubbleBg,
        // Me-bubble text: always #0A0A0A — the gradient's light stop at 0% (top-left)
        // ensures readable contrast for all 6 agents. Borderline case: ATLAS mid-gray
        // (#6C757D) at 50%, but the overall gradient reads light-to-dark so text sits
        // comfortably against the lighter half. Flagged: ATLAS + CIRCUIT are the darkest.
        color: isMe ? '#0A0A0A' : TOKENS.text,
        border: bubbleBorder,
        fontFamily: FONT, fontSize: 14, lineHeight: 1.45,
        boxShadow: bubbleShadow,
        // TODO Part 2: render replyTo preview above text here
        // TODO Part 2: render reactions row below bubble
      }}>
        {msg.text}
      </div>

      {/* Meta row: time + status icon */}
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
