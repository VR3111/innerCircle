// NotificationsScreen — ported from prototype-source/screen-notifications.jsx
// Route: /notifications
//
// Replaces PlaceholderScreen at /notifications.
// Entry point: HomeScreen bell icon (already navigates to /notifications ✓).
//
// markAll is LOCAL STATE ONLY for v1.
// TODO: wire markAll to backend notification read-state when persistence exists.
//
// Rows are NOT clickable for v1.
// TODO: clicking a row should deep-link to the relevant post / leaderboard
//       position / profile depending on `kind`.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKENS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import { NOTIFICATIONS, type Notification } from '@/lib/mock-data';

// ─── iconBtnStyle — matches SettingsScreen / CategoryLeaderboardScreen ─────────
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

// ─── NotifIcon ────────────────────────────────────────────────────────────────
// Agent-tied notifications → AgentDot in category color.
// Non-agent notifications (creators_club, level) → gold gradient circle + SLMark.

function NotifIcon({ notif }: { notif: Notification }) {
  if (notif.agent) {
    return <AgentDot agent={notif.agent} size={32} clickable={false} />;
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <SLMark size={16} color="#0A0A0A" />
    </div>
  );
}

// ─── NotificationsScreen ──────────────────────────────────────────────────────

export function NotificationsScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>(NOTIFICATIONS);

  // TODO: wire to backend — marks all server-side notifications read
  const markAll = () => setItems(items.map(n => ({ ...n, unread: false })));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: TOKENS.bg, overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(18px + var(--ic-top-inset,0px)) 20px 8px',
      }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>

        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 17, fontWeight: 600, color: TOKENS.text,
        }}>
          Notifications
        </span>

        <button
          onClick={markAll}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: TOKENS.gold,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, letterSpacing: 1.4,
            padding: '4px 0',
          }}
        >
          MARK ALL
        </button>
      </div>

      {/* ── Scrollable list ─────────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 40px' }}
      >
        {items.map((n, i) => (
          // TODO: add onClick to deep-link into post/leaderboard/profile by `kind`
          <div
            key={n.id}
            style={{
              display: 'flex', gap: 12, padding: '14px',
              marginBottom: 8, borderRadius: 12,
              background: n.unread ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${n.unread ? 'rgba(212,175,55,0.2)' : TOKENS.line}`,
              animation: `sl-fade-in 400ms ease ${i * 40}ms both`,
            }}
          >
            <NotifIcon notif={n} />

            {/* Text + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13, color: TOKENS.text, lineHeight: 1.45,
              }}>
                {n.text}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 9.5, color: TOKENS.mute2, letterSpacing: 1.2,
                }}>
                  {n.kind.toUpperCase().replace(/_/g, ' ')} · {n.time}
                </span>
              </div>
            </div>

            {/* Unread dot — pulsing gold glow */}
            {n.unread && (
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: TOKENS.gold,
                boxShadow: `0 0 8px ${TOKENS.gold}`,
                marginTop: 6,
                animation: 'ic-pulse 1.8s ease-out infinite',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
