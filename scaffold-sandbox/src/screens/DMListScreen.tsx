// DMListScreen — DM inbox with agent + user threads
// Route: /dms
//
// Part 2 TODO list:
//   - Pass thread context to /paywall so paywall knows which tier gate was hit
//   - Swipe-to-archive / swipe-to-mute gesture on rows
//   - Long-press context menu on rows
//   - Real unread count badge from backend
//   - Persist mute state to backend

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKENS, AGENTS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import { DM_THREADS, type DMThread } from '@/lib/mock-data';

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

// ── ThreadRow ─────────────────────────────────────────────────────────────────

interface ThreadRowProps {
  thread: DMThread;
  i: number;
  isPremium: boolean;
  onNavigate: (path: string) => void;
}

function ThreadRow({ thread, i, isPremium, onNavigate }: ThreadRowProps) {
  const [hovered, setHovered] = useState(false);
  const effectivelyLocked = thread.locked && !isPremium;

  const A = thread.agent ? AGENTS[thread.agent] : null;
  const displayName = A ? A.name : `@${thread.userHandle ?? ''}`;

  // Agent-color accent: applied only to unlocked agent threads
  const showAgentAccent = thread.kind === 'agent' && A !== null && !effectivelyLocked;

  const handleClick = () => {
    if (effectivelyLocked) {
      // TODO: Part 2 will pass thread context (id, tier) to paywall
      onNavigate('/paywall');
      return;
    }
    onNavigate('/dm/' + thread.id);
  };

  // Non-left border color (changes on hover); left border stays as agent color for agent rows
  const borderSideColor = hovered
    ? (effectivelyLocked ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)')
    : (effectivelyLocked ? 'rgba(212,175,55,0.2)' : TOKENS.line);

  const rowBg = effectivelyLocked
    ? 'rgba(212,175,55,0.04)'
    : showAgentAccent
      ? A!.color + '1A'        // hex 1A ≈ 10% opacity agent color
      : 'rgba(255,255,255,0.02)';

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 12,
        paddingTop: 12,
        paddingRight: 14,
        paddingBottom: 12,
        // Compensate for the 3px left border with 2px less left padding
        paddingLeft: showAgentAccent ? 12 : 14,
        marginBottom: 8,
        borderRadius: 14,
        background: rowBg,
        // Split borders: left gets 3px agent color accent; other 3 sides use hover-responsive color
        borderTop:    `1px solid ${borderSideColor}`,
        borderRight:  `1px solid ${borderSideColor}`,
        borderBottom: `1px solid ${borderSideColor}`,
        borderLeft: showAgentAccent
          ? `3px solid ${A!.color}`
          : `1px solid ${borderSideColor}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 150ms',
        animation: `sl-fade-in 400ms ease ${i * 50}ms both`,
      }}
    >
      {/* ── Avatar ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {A ? (
          <AgentDot agent={thread.agent!} size={44} clickable={false} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a2a2a, #121212)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, fontWeight: 700, fontSize: 16, color: TOKENS.text,
            border: `1px solid ${TOKENS.line2}`,
          }}>
            {thread.userInitials}
          </div>
        )}
        {/* Online indicator */}
        {thread.online && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 8, height: 8, borderRadius: '50%',
            background: '#2A9D8F',
            border: `2px solid ${TOKENS.bg}`,
          }} />
        )}
      </div>

      {/* ── Middle ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: TOKENS.text }}>
            {displayName}
          </span>
          {/* "AGENT" pill — uses agent's own color so each category is distinct */}
          {thread.tierBadge === 'agent' && A && (
            <span style={{
              padding: '2px 6px', borderRadius: 4,
              background: A.color + '26',   // hex 26 ≈ 15% opacity
              color: A.color,
              fontFamily: MONO, fontSize: 8, letterSpacing: 1.2, fontWeight: 700,
            }}>AGENT</span>
          )}
          {/* Inner Circle diamond for IC users */}
          {thread.tierBadge === 'inner_circle' && (
            <SLMark size={11} color={TOKENS.gold} />
          )}
          {/* Muted bell-slash */}
          {thread.muted && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ color: TOKENS.mute3 }}>
              <path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M1 1l22 22"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        {/* Preview */}
        <div style={{
          fontFamily: FONT, fontSize: 13,
          color: effectivelyLocked ? TOKENS.gold : TOKENS.mute,
          marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {effectivelyLocked ? 'Inner Circle only — tap to unlock' : thread.last}
        </div>
      </div>

      {/* ── Right column ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: TOKENS.mute2 }}>{thread.time}</span>
        {thread.unread > 0 && !effectivelyLocked && (
          <span style={{
            minWidth: 18, height: 18, borderRadius: 999, padding: '0 6px',
            background: TOKENS.gold, color: '#0A0A0A',
            fontFamily: FONT, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{thread.unread}</span>
        )}
      </div>
    </button>
  );
}

// ── DMListScreen ──────────────────────────────────────────────────────────────

export function DMListScreen() {
  const navigate = useNavigate();
  const isPremium = localStorage.getItem('sl-premium') === '1';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(18px + var(--ic-top-inset,0px)) 20px 8px',
        flexShrink: 0,
      }}>
        <button type="button" onClick={() => navigate(-1)} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600 }}>Messages</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Thread list */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 100px' }}
      >
        {DM_THREADS.map((t, i) => (
          <ThreadRow
            key={t.id}
            thread={t}
            i={i}
            isPremium={isPremium}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}
