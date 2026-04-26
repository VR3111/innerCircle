// SettingsScreen — ported from prototype-source/screen-settings.jsx
// Three helper components (SettingsGroup, Row, Toggle) are file-local;
// they are settings-specific and not shared with other screens.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TOKENS } from '@/lib/design-tokens';
import { SLMark } from '@/components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { Skeleton } from '@/components/states';

// ── Helper: icon button style (back / placeholder spacer) ─────────────────────
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
};

// ── SettingsGroup ─────────────────────────────────────────────────────────────
interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}
function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 10, color: TOKENS.mute,
        letterSpacing: 1.5, padding: '0 4px 8px',
      }}>{title}</div>
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)', border: `1px solid ${TOKENS.line}`,
      }}>{children}</div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
interface RowProps {
  label: string;
  value?: string;
  chevron?: boolean;
  last?: boolean;
  danger?: boolean;
  /** Renders value in mono gold font (e.g. "FREE TRIAL") */
  gold?: boolean;
  onClick?: () => void;
}
function Row({ label, value, chevron, last, danger, gold, onClick }: RowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', padding: '13px 14px',
        borderBottom: last ? 'none' : `1px solid ${TOKENS.line}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{
        flex: 1,
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
        color: danger ? TOKENS.down : TOKENS.text,
      }}>{label}</span>

      {value && (
        <span style={{
          fontFamily: gold ? 'ui-monospace, monospace' : 'Inter, system-ui, sans-serif',
          fontSize: gold ? 10 : 13,
          color: gold ? TOKENS.gold : TOKENS.mute,
          marginRight: chevron ? 6 : 0,
          letterSpacing: gold ? 1.4 : 0,
        }}>{value}</span>
      )}

      {chevron && (
        <svg width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1l6 6-6 6" stroke={TOKENS.mute3} strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}
function Toggle({ label, on, onChange, last }: ToggleProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 14px',
      borderBottom: last ? 'none' : `1px solid ${TOKENS.line}`,
    }}>
      <span style={{
        flex: 1,
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: TOKENS.text,
      }}>{label}</span>

      {/* 44×26 pill toggle — gold when on, with soft glow */}
      <button
        onClick={() => onChange(!on)}
        aria-pressed={on}
        style={{
          width: 44, height: 26, borderRadius: 999, padding: 2, cursor: 'pointer',
          background: on ? TOKENS.gold : 'rgba(255,255,255,0.14)',
          border: 'none', position: 'relative',
          transition: 'background-color 220ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: on ? '0 0 12px rgba(212,175,55,0.35)' : 'none',
        }}
      >
        {/* thumb */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 260ms cubic-bezier(.2,.8,.2,1.1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}/>
      </button>
    </div>
  );
}

// ── SettingsScreen ────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id ?? '');
  const [dark,    setDark]    = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [notifs,  setNotifs]  = useState(true);

  const premium = profile?.is_inner_circle ?? false;

  const displayName = profile?.display_name ?? profile?.username ?? user?.user_metadata?.username ?? '?';
  const username    = profile?.username ?? user?.user_metadata?.username ?? '?';
  const email       = user?.email ?? '—';
  const avatarUrl   = profile?.avatar_url ?? null;
  const initial     = (displayName)[0]?.toUpperCase() ?? '?';
  const signalScore = profile?.signal_score ?? 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: TOKENS.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 8px',
      }}>
        <button onClick={() => navigate(-1)} style={iconBtnStyle} aria-label="Back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 17, fontWeight: 600, color: TOKENS.text,
        }}>Settings</span>

        {/* Right-side spacer keeps title centred */}
        <div style={{ width: 36 }}/>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 40px' }}
      >
        {/* Profile summary card */}
        {profileLoading ? (
          <div style={{
            display: 'flex', gap: 14, alignItems: 'center',
            padding: '16px', borderRadius: 14, marginBottom: 18,
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${TOKENS.line}`,
          }}>
            <Skeleton className="w-[52px] h-[52px] rounded-full" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: 14, alignItems: 'center',
            padding: '16px', borderRadius: 14, marginBottom: 18,
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${TOKENS.line}`,
          }}>
            {/* Avatar circle */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2a2a2a, #121212)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 20, fontWeight: 700, color: TOKENS.text,
              border: premium ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.line2}`,
              boxShadow: premium ? `0 0 16px ${TOKENS.gold}55` : 'none',
              overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover' }} />
              ) : initial}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: TOKENS.text,
                }}>{username}</span>

                {premium && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 7px', borderRadius: 999,
                    background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
                    fontFamily: 'ui-monospace, monospace', fontSize: 8.5,
                    color: '#0A0A0A', letterSpacing: 1,
                  }}>
                    <SLMark size={8} color="#0A0A0A" /> INNER CIRCLE
                  </span>
                )}
              </div>

              <div style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 10,
                color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 3,
              }}>{signalScore.toLocaleString()} SIGNAL</div>
            </div>
          </div>
        )}

        {/* "Join Inner Circle" CTA — hidden when premium = true */}
        {!premium && (
          <button
            onClick={() => navigate('/paywall')}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(244,212,124,0.14) 0%, rgba(140,109,26,0.14) 100%)',
              border: `1px solid ${TOKENS.gold}66`,
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, textAlign: 'left',
            }}
          >
            <SLMark size={26} rotate shimmer />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: TOKENS.gold,
              }}>Join Inner Circle</div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: TOKENS.mute, marginTop: 2,
              }}>Direct replies, DMs, and early drops.</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke={TOKENS.gold} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* ── ACCOUNT ──────────────────────────────────────────────────────── */}
        <SettingsGroup title="ACCOUNT">
          <Row label="Email"        value={email}                                     chevron />
          <Row label="Username"     value={`@${username}`}                            chevron />
          <Row label="Display name" value={displayName}                               chevron />
          <Row label="Signal score" value={`${signalScore.toLocaleString()} · SIGNAL`} chevron last />
        </SettingsGroup>

        {/* ── SUBSCRIPTION ─────────────────────────────────────────────────── */}
        <SettingsGroup title="SUBSCRIPTION">
          {/* Dead code until premium state wires in — renders when premium = true */}
          {premium ? (
            <>
              <Row label="Plan"                value="Annual · $79/yr" chevron />
              <Row label="Renews"              value="Apr 20, 2027"    chevron />
              {/* TODO: wire cancel flow when subscription management is implemented */}
              <Row label="Cancel subscription" danger chevron last />
            </>
          ) : (
            <Row
              label="Inner Circle"
              value="FREE TRIAL"
              gold chevron last
              onClick={() => navigate('/paywall')}
            />
          )}
        </SettingsGroup>

        {/* ── NOTIFICATIONS ─────────────────────────────────────────────────── */}
        <SettingsGroup title="NOTIFICATIONS">
          <Toggle label="Push notifications" on={notifs}  onChange={setNotifs} />
          <Toggle label="Haptic feedback"    on={haptics} onChange={setHaptics} />
          <Row    label="Notification types" chevron last />
        </SettingsGroup>

        {/* ── APPEARANCE ───────────────────────────────────────────────────── */}
        <SettingsGroup title="APPEARANCE">
          <Toggle label="Dark mode" on={dark} onChange={setDark} last />
        </SettingsGroup>

        {/* ── PRIVACY ──────────────────────────────────────────────────────── */}
        <SettingsGroup title="PRIVACY">
          <Row label="Who can DM me"     value="Everyone" chevron />
          <Row label="Blocked accounts"  chevron />
          <Row label="Data & permissions" chevron last />
        </SettingsGroup>

        {/* ── SUPPORT ──────────────────────────────────────────────────────── */}
        <SettingsGroup title="SUPPORT">
          <Row label="Help center"      chevron />
          <Row label="Contact support"  chevron />
          <Row label="Terms of service" chevron />
          <Row label="Privacy policy"   chevron last />
        </SettingsGroup>

        {/* Sign out — clears storage and returns to Splash (root) */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,90,95,0.06)', border: '1px solid rgba(255,90,95,0.25)',
            color: TOKENS.down,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: 0.2,
          }}
        >Sign out</button>

        {/* Version footer */}
        <div style={{
          textAlign: 'center', padding: '18px 0 4px',
          fontFamily: 'ui-monospace, monospace', fontSize: 9.5,
          color: TOKENS.mute3, letterSpacing: 1.2,
        }}>SOCIAL LEVELING v1.0.0 · BUILD 1024</div>

      </div>
    </div>
  );
}
