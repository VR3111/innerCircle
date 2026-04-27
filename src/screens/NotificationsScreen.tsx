// NotificationsScreen — ported from prototype-source/screen-notifications.jsx
// Route: /notifications
//
// Wired to NotificationsContext for real Supabase data.
// Entry point: HomeScreen bell icon (already navigates to /notifications ✓).

import { useNavigate } from 'react-router';
import { TOKENS, type AgentId } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import { useNotifications } from '../contexts/NotificationsContext';

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
// Non-agent notifications → gold gradient circle + SLMark.

function NotifIcon({ agentId }: { agentId?: string }) {
  if (agentId) {
    return <AgentDot agent={agentId.toUpperCase() as AgentId} size={32} clickable={false} />;
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
  const { items, loading, markRead, markAllRead } = useNotifications();

  function handleTap(n: typeof items[number]) {
    if (!n.read) markRead(n.id);
    if (n.href) navigate(n.href);
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: TOKENS.bg, overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(8px + var(--ic-top-inset,0px)) 20px 8px',
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
          onClick={markAllRead}
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
        {/* Loading state */}
        {loading && (
          <div style={{
            display: 'flex', justifyContent: 'center', padding: '60px 0',
            fontFamily: 'ui-monospace, monospace', fontSize: 11,
            color: TOKENS.mute2, letterSpacing: 1.2,
          }}>
            LOADING…
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 0', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${TOKENS.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={TOKENS.mute2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke={TOKENS.mute2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 11,
              color: TOKENS.mute2, letterSpacing: 1.2,
            }}>
              NO NOTIFICATIONS YET
            </span>
          </div>
        )}

        {/* Notification rows */}
        {!loading && items.map((n, i) => (
          <div
            key={n.id}
            onClick={() => handleTap(n)}
            onMouseEnter={(e) => {
              if (!n.href) return;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = !n.read
                ? 'rgba(212,175,55,0.4)'
                : 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = !n.read
                ? 'rgba(212,175,55,0.2)'
                : TOKENS.line;
            }}
            style={{
              display: 'flex', gap: 12, padding: '14px',
              marginBottom: 8, borderRadius: 12,
              background: !n.read ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${!n.read ? 'rgba(212,175,55,0.2)' : TOKENS.line}`,
              animation: `sl-fade-in 400ms ease ${i * 40}ms both`,
              cursor: n.href ? 'pointer' : 'default',
              transition: 'transform 180ms cubic-bezier(.2,.8,.2,1), border-color 180ms ease',
            }}
          >
            <NotifIcon agentId={n.agentId} />

            {/* Text + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13, color: TOKENS.text, lineHeight: 1.45,
              }}>
                {n.title}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 9.5, color: TOKENS.mute2, letterSpacing: 1.2,
                }}>
                  {n.type.toUpperCase().replace(/_/g, ' ')} · {n.timestamp}
                </span>
              </div>
            </div>

            {/* Unread dot — pulsing gold glow */}
            {!n.read && (
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
