import { useState, useEffect } from 'react';
import { TOKENS } from '@/lib/design-tokens';

// ─── SLMark ───────────────────────────────────────────────────────────────────
// Diamond + inner rotated square mark.
// Ported from prototype-source/logo.jsx L7–71.
// sl-spin and sl-shimmer-sweep keyframes are defined in globals.css.
export function SLMark({
  size = 28,
  color = TOKENS.gold,
  rotate = false,
  shimmer = false,
}: {
  size?: number;
  color?: string;
  rotate?: boolean;
  shimmer?: boolean;
}) {
  const s = size;
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: s, height: s, flexShrink: 0 }}>
      <svg
        viewBox="0 0 100 100"
        width={s}
        height={s}
        style={{
          display: 'block',
          animation: rotate ? 'sl-spin 12s linear infinite' : 'none',
          transformOrigin: '50% 50%',
          filter: shimmer ? 'drop-shadow(0 0 6px rgba(212,175,55,0.45))' : 'none',
        }}
      >
        <defs>
          {/* gold diagonal gradient — used for stroke when shimmer=true */}
          <linearGradient id={`sl-g-${s}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#F4D47C" />
            <stop offset="45%"  stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C6D1A" />
          </linearGradient>
          {/* horizontal shimmer sweep gradient */}
          <linearGradient id={`sl-sh-${s}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="45%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.85)" />
            <stop offset="55%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* clip to diamond shape so shimmer rect doesn't bleed outside */}
          <clipPath id={`sl-clip-${s}`}>
            <path d="M50 6 L94 50 L50 94 L6 50 Z" />
          </clipPath>
        </defs>

        {/* outer diamond outline */}
        <path
          d="M50 6 L94 50 L50 94 L6 50 Z"
          fill="none"
          stroke={shimmer ? `url(#sl-g-${s})` : color}
          strokeWidth="7"
          strokeLinejoin="miter"
        />
        {/* inner rotated square outline */}
        <rect
          x="35" y="35" width="30" height="30"
          transform="rotate(45 50 50)"
          fill="none"
          stroke={shimmer ? `url(#sl-g-${s})` : color}
          strokeWidth="7"
          strokeLinejoin="miter"
        />
        {/* shimmer sweep — animated rect clipped to diamond bounds */}
        {shimmer && (
          <g clipPath={`url(#sl-clip-${s})`}>
            <rect
              x="-150" y="-20" width="120" height="140"
              fill={`url(#sl-sh-${s})`}
              style={{ animation: 'sl-shimmer-sweep 3.2s ease-in-out infinite' }}
              transform="rotate(18 50 50)"
            />
          </g>
        )}
      </svg>
    </span>
  );
}

// ─── SocialLevelingLogo ───────────────────────────────────────────────────────
// Horizontal inline lockup: SLMark + per-letter staggered "SOCIAL LEVELING".
// Ported from prototype-source/logo.jsx L72–112.
// Props:
//   size    — scale multiplier (default 1). Affects font, mark, and gap sizes.
//   compact — shorthand for size=0.85 (header usage). Multiplied on top of size.
//   rotate  — pass through to SLMark (default true)
//   shimmer — pass through to SLMark (default true)
//   mono    — render everything white (for light bg contexts)
export function SocialLevelingLogo({
  size = 1,
  rotate = true,
  shimmer = true,
  mono = false,
  compact = false,
}: {
  size?: number;
  rotate?: boolean;
  shimmer?: boolean;
  mono?: boolean;
  compact?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const s = compact ? 0.85 * size : size;
  const fs = 13 * s;
  const tracking = 3.4;
  const markSize = 18 * s;
  const gold = TOKENS.gold;
  const white = '#FFFFFF';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 * s }}>
      <SLMark
        size={markSize}
        color={mono ? white : gold}
        rotate={rotate}
        shimmer={shimmer && !mono}
      />
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: tracking,
        display: 'inline-flex',
      }}>
        {'SOCIAL'.split('').map((ch, i) => (
          <span
            key={'s' + i}
            style={{
              color: mono ? white : gold,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(5px)',
              transition: `opacity 420ms cubic-bezier(.2,.7,.2,1) ${i * 26}ms, transform 480ms cubic-bezier(.2,.7,.2,1) ${i * 26}ms`,
              display: 'inline-block',
              whiteSpace: 'pre',
            }}
          >{ch}</span>
        ))}
        {/* spacer between SOCIAL and LEVELING, width = letterSpacing value */}
        <span style={{ width: tracking, display: 'inline-block' }} />
        {'LEVELING'.split('').map((ch, i) => (
          <span
            key={'l' + i}
            style={{
              color: white,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(5px)',
              // stagger LEVELING letters starting after SOCIAL (offset +6)
              transition: `opacity 420ms cubic-bezier(.2,.7,.2,1) ${(i + 6) * 26}ms, transform 480ms cubic-bezier(.2,.7,.2,1) ${(i + 6) * 26}ms`,
              display: 'inline-block',
              whiteSpace: 'pre',
            }}
          >{ch}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
// Backward-compatible wrapper around SocialLevelingLogo.
// All screens import { Logo } — this keeps those imports working unchanged.
export function Logo({ compact = false }: { compact?: boolean }) {
  return <SocialLevelingLogo compact={compact} />;
}

// ─── SocialLevelingSplash ─────────────────────────────────────────────────────
// Vertical stacked lockup for the splash screen: large SLMark above wordmark.
// Ported from prototype-source/logo.jsx L115–131.
export function SocialLevelingSplash({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 * scale,
    }}>
      <SLMark size={92 * scale} rotate shimmer />
      <div style={{
        fontFamily: 'Inter, system-ui',
        fontWeight: 700,
        fontSize: 20 * scale,
        letterSpacing: 5.4,
        display: 'inline-flex',
      }}>
        <span style={{ color: TOKENS.gold }}>SOCIAL</span>
        <span style={{ width: 6 }} />
        <span style={{ color: '#FFFFFF' }}>LEVELING</span>
      </div>
    </div>
  );
}
