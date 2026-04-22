import { motion } from 'motion/react';
import { TOKENS } from '@/lib/design-tokens';

export function Logo({ compact = false, accent = '#FFFFFF' }: { compact?: boolean; accent?: string }) {
  const text = 'SOCIAL LEVELING';
  const fs = compact ? 12 : 13;
  const tracking = compact ? 3.2 : 3.6;

  return (
    <div className="inline-flex items-center gap-2 relative">
      <svg width={16} height={16} viewBox="0 0 20 20" className="block">
        <circle cx="10" cy="10" r="8.5" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="1">
          <animate attributeName="r" values="8.5;9;8.5" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="10" cy="10" r="5" fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1">
          <animate attributeName="r" values="5;5.6;5" dur="3.6s" begin="0.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="10" cy="10" r="2" fill={accent}>
          <animate attributeName="r" values="2;2.4;2" dur="3.6s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <g className="animate-sl-sweep" style={{ transformOrigin: '10px 10px' }}>
          <line x1="10" y1="10" x2="18.5" y2="10" stroke={accent} strokeOpacity="0.4" strokeWidth="0.8" />
        </g>
      </svg>

      <div
        className="inline-flex font-sans font-bold"
        style={{ fontSize: fs, letterSpacing: tracking, color: accent }}
      >
        {text.split('').map((ch, i) => (
          <motion.span
            key={i} className="inline-block whitespace-pre"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: i * 0.028, ease: [0.2, 0.7, 0.2, 1] }}
          >{ch}</motion.span>
        ))}
      </div>
    </div>
  );
}

// ─── SLMark ──────────────────────────────────────────────────────────────────
// Private component supporting SocialLevelingSplash only.
// Ported from prototype-source/logo.jsx (the correct diamond+inner-square shape).
// NOTE: the existing exported `Logo` above uses concentric circles — known regression,
// intentionally left broken per task constraint. This SLMark is separate.
// Gold colour: uses TOKENS.gold (#E9C46A). Prototype uses #D4AF37 — flagged deviation.
function SLMark({
  size = 28,
  rotate = false,
  shimmer = false,
}: {
  size?: number;
  rotate?: boolean;
  shimmer?: boolean;
}) {
  const s = size;
  const color = TOKENS.gold;
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
          <linearGradient id={`sl-g-${s}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#F4D47C" />
            <stop offset="45%"  stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C6D1A" />
          </linearGradient>
          <linearGradient id={`sl-sh-${s}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="45%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.85)" />
            <stop offset="55%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
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
        {/* shimmer sweep overlay, clipped to diamond bounds */}
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

// ─── SocialLevelingSplash ─────────────────────────────────────────────────────
// Big splash variant — large SLMark above centered wordmark.
// Ported from prototype-source/logo.jsx L115–131.
// Downstream gap: SLMark here is the correct diamond shape, but the existing
// exported `Logo` (used in HomeScreen/AuthScreen headers) still uses broken
// concentric circles. Both live in this file; the Logo regression is fixed later.
export function SocialLevelingSplash({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 * scale }}>
      <SLMark size={92 * scale} rotate shimmer />
      <div
        style={{
          fontFamily: 'Geist, system-ui',
          fontWeight: 700,
          fontSize: 20 * scale,
          letterSpacing: 5.4,
          display: 'inline-flex',
        }}
      >
        <span style={{ color: TOKENS.gold }}>SOCIAL</span>
        <span style={{ width: 6 }} />
        <span style={{ color: '#FFFFFF' }}>LEVELING</span>
      </div>
    </div>
  );
}
