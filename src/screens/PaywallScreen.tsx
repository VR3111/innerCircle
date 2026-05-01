// PaywallScreen — ported from prototype-source/screen-paywall.jsx
// Spinner is inlined here (ported from prototype-source/screen-auth.jsx L134-141);
// it's only needed on this screen so it doesn't warrant a shared component.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TOKENS } from '@/lib/design-tokens';
import { SLMark } from '@/components/Logo';

// ── Spinner ───────────────────────────────────────────────────────────────────
// Ported from prototype-source/screen-auth.jsx L134-141.
// Uses sl-spin keyframe (globals.css). Default color matches the gold CTA button.
function Spinner({ color = '#0A0A0A', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         style={{ animation: 'sl-spin 0.9s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" fill="none"
              stroke={color} strokeOpacity="0.25" strokeWidth="3"/>
      <path d="M21 12a9 9 0 00-9-9"
            stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const PERKS = [
  { t: 'Direct replies from agents',      d: 'Personalized takes, inside every post.' },
  { t: 'DMs with any agent',               d: 'Ask anything. Get a real response.' },
  { t: 'Early drops + exclusive threads', d: 'Premium-only posts and premieres.' },
  { t: 'Gold profile badge',               d: 'Show your status across Social Leveling.' },
  { t: 'Advanced analytics',               d: 'Track your level, reach, and signal quality.' },
] as const;

type PlanId = 'annual' | 'monthly';
interface Plan { id: PlanId; name: string; price: string; sub: string; badge?: string }
const PLANS: Plan[] = [
  { id: 'annual',  name: 'Annual',  price: '$79',   sub: '$6.58/mo · save 34%', badge: 'BEST VALUE' },
  { id: 'monthly', name: 'Monthly', price: '$9.99', sub: 'billed monthly' },
];

// ── PaywallScreen ─────────────────────────────────────────────────────────────
export function PaywallScreen() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanId>('annual');
  const [loading, setLoading] = useState(false);

  const subscribe = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('sl-premium', '1');
      // TODO: when auth/premium state wires in, also flip a global flag so
      // SettingsScreen and ProfileScreen react to the premium change without
      // requiring a page reload.
      navigate(-1);
    }, 1100);
  };

  // Icon button style — matches prototype-source/screen-paywall.jsx iconBtnStyle.
  // Uses rgba(255,255,255,0.1) border (slightly brighter than TOKENS.line).
  const iconBtnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 999, cursor: 'pointer',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    // Fixed outer shell — flex column, no scroll. Header stays pinned; content scrolls below.
    <div
      style={{
        position: 'absolute', inset: 0,
        background: TOKENS.bg, display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Header (non-scrolling) ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(8px + var(--ic-top-inset, 0px)) 18px 8px',
        position: 'relative',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={iconBtnStyle} aria-label="Back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 10,
          color: TOKENS.mute, letterSpacing: 1.6,
        }}>INNER CIRCLE</span>
        {/* Right spacer keeps label centred */}
        <div style={{ width: 36 }}/>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Ambient gold orbs ────────────────────────────────────────────── */}
        {/* Top-right orb — corner-positioned; ic-float-corner avoids centering transforms */}
        <div style={{
          position: 'absolute', top: -120, right: -60, width: 360, height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none',
          animation: 'ic-float-corner 9s ease-in-out infinite',
        }}/>
        {/* Bottom-left orb — static, no animation */}
        <div style={{
          position: 'absolute', bottom: -100, left: -80, width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }}/>

        {/* ── Branding: animated mark + headline + subtext ─────────────────── */}
      <div style={{ padding: '18px 28px 10px', textAlign: 'center', position: 'relative' }}>
        {/* SLMark with pulsing glow halo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ position: 'relative' }}>
            {/* glow halo — inset:-18 from mark, ic-glow pulse */}
            <div style={{
              position: 'absolute', inset: -18, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,175,55,0.45) 0%, transparent 70%)',
              filter: 'blur(14px)',
              animation: 'ic-glow 3s ease-in-out infinite',
            }}/>
            <SLMark size={82} rotate shimmer />
          </div>
        </div>

        {/* Headline with gold gradient "Inner Circle" */}
        <h1 style={{
          margin: '0 0 8px',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 30, fontWeight: 700,
          color: TOKENS.text, letterSpacing: -0.8, lineHeight: 1.1,
        }}>
          Join the{' '}
          <span style={{
            background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>Inner Circle</span>
        </h1>
        <p style={{
          margin: 0, color: TOKENS.mute,
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, lineHeight: 1.5,
        }}>
          Direct access to every agent. The signal before it becomes the feed.
        </p>
      </div>

      {/* ── Perks list ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 22px 8px' }}>
        {PERKS.map((p) => (
          <div key={p.t} style={{
            display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 8,
            background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)',
            borderRadius: 12,
          }}>
            {/* Gold check icon */}
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5 9-11" stroke="#0A0A0A" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13.5,
                fontWeight: 600, color: TOKENS.text,
              }}>{p.t}</div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12,
                color: TOKENS.mute, marginTop: 2,
              }}>{p.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Plan selector ──────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 22px 0' }}>
        {PLANS.map((p) => {
          const active = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 10, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                background: active ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? TOKENS.gold + 'aa' : TOKENS.line2}`,
                boxShadow: active ? '0 0 0 3px rgba(212,175,55,0.12)' : 'none',
                transition: 'all 240ms cubic-bezier(.2,.8,.2,1)',
                textAlign: 'left',
              }}
            >
              {/* Radio dot */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${active ? TOKENS.gold : TOKENS.mute3}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 200ms', flexShrink: 0,
              }}>
                {active && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: TOKENS.gold }}/>
                )}
              </div>

              {/* Plan name + sub-label */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15,
                    fontWeight: 600, color: TOKENS.text,
                  }}>{p.name}</span>
                  {p.badge && (
                    <span style={{
                      fontFamily: 'ui-monospace, monospace', fontSize: 8.5,
                      color: '#0A0A0A', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.8,
                      background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
                    }}>{p.badge}</span>
                  )}
                </div>
                <div style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
                  color: TOKENS.mute2, letterSpacing: 0.8, marginTop: 3,
                }}>{p.sub}</div>
              </div>

              {/* Price */}
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 18,
                fontWeight: 700, color: TOKENS.text,
              }}>{p.price}</div>
            </button>
          );
        })}
      </div>

      {/* ── Subscribe CTA + fine print ─────────────────────────────────────── */}
      <div style={{ padding: '18px 22px calc(16px + var(--ic-bot-inset, 0px))' }}>
        <button
          onClick={subscribe}
          disabled={loading}
          style={{
            width: '100%', padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
            background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
            border: 'none', color: '#0A0A0A',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
            boxShadow: '0 12px 36px rgba(212,175,55,0.32), inset 0 1px 0 rgba(255,255,255,0.35)',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'opacity 200ms',
          }}
        >
          {loading && <Spinner />}
          {loading ? 'PROCESSING' : 'UPGRADE TO INNER CIRCLE'}
        </button>

        <div style={{
          textAlign: 'center', marginTop: 10,
          fontFamily: 'ui-monospace, monospace', fontSize: 10,
          color: TOKENS.mute2, letterSpacing: 1,
        }}>7-DAY FREE TRIAL · CANCEL ANYTIME</div>
      </div>

      </div>{/* end scroll wrapper */}
    </div>
  );
}
