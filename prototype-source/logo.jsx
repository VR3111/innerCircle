// logo.jsx — SOCIAL LEVELING mark (diamond + inner square) with gold shimmer

const { useEffect: _le, useState: _ls } = React;

// The mark alone — a rhombus with an inset rotated square.
// Props: size, color, rotate (bool, spins 360° forever), shimmer (bool)
function SLMark({ size = 28, color = '#D4AF37', rotate = false, shimmer = false }) {
  // Outer diamond: points at top/right/bottom/left. Inner: smaller rotated square.
  const s = size;
  return (
    <span style={{
      position: 'relative', display: 'inline-block', width: s, height: s, flexShrink: 0,
    }}>
      <svg
        viewBox="0 0 100 100" width={s} height={s}
        style={{
          display: 'block',
          animation: rotate ? 'sl-spin 12s linear infinite' : 'none',
          transformOrigin: '50% 50%',
          filter: shimmer ? 'drop-shadow(0 0 6px rgba(212,175,55,0.45))' : 'none',
        }}
      >
        <defs>
          <linearGradient id={`sl-g-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#F4D47C"/>
            <stop offset="45%" stopColor="#D4AF37"/>
            <stop offset="100%" stopColor="#8C6D1A"/>
          </linearGradient>
          <linearGradient id={`sl-sh-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)"/>
            <stop offset="45%"  stopColor="rgba(255,255,255,0)"/>
            <stop offset="50%"  stopColor="rgba(255,255,255,0.85)"/>
            <stop offset="55%"  stopColor="rgba(255,255,255,0)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          <clipPath id={`sl-clip-${size}`}>
            <path d="M50 6 L94 50 L50 94 L6 50 Z" />
          </clipPath>
        </defs>
        {/* outer diamond outline */}
        <path
          d="M50 6 L94 50 L50 94 L6 50 Z"
          fill="none"
          stroke={shimmer ? `url(#sl-g-${size})` : color}
          strokeWidth="7"
          strokeLinejoin="miter"
        />
        {/* inner rotated square outline */}
        <rect
          x="35" y="35" width="30" height="30"
          transform="rotate(45 50 50)"
          fill="none"
          stroke={shimmer ? `url(#sl-g-${size})` : color}
          strokeWidth="7"
          strokeLinejoin="miter"
        />
        {/* shimmer sweep overlay, clipped to diamond bounds */}
        {shimmer && (
          <g clipPath={`url(#sl-clip-${size})`}>
            <rect
              x="-150" y="-20" width="120" height="140"
              fill={`url(#sl-sh-${size})`}
              style={{ animation: 'sl-shimmer 3.2s ease-in-out infinite' }}
              transform="rotate(18 50 50)"
            />
          </g>
        )}
      </svg>
    </span>
  );
}

// Full lockup — mark + "SOCIAL LEVELING" with SOCIAL gold + LEVELING white.
function SocialLevelingLogo({ size = 1, rotate = true, shimmer = true, mono = false }) {
  const [mounted, setMounted] = _ls(false);
  _le(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  const fs = 13 * size;
  const tracking = 3.4;
  const markSize = 18 * size;
  const gold = '#D4AF37';
  const white = '#FFFFFF';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 * size }}>
      <SLMark size={markSize} color={mono ? white : gold} rotate={rotate} shimmer={shimmer && !mono} />
      <div style={{
        fontFamily: 'Geist, system-ui, sans-serif', fontSize: fs, fontWeight: 700,
        letterSpacing: tracking, display: 'inline-flex',
      }}>
        {'SOCIAL'.split('').map((ch, i) => (
          <span key={'s'+i} style={{
            color: mono ? white : gold,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(5px)',
            transition: `opacity 420ms cubic-bezier(.2,.7,.2,1) ${i*26}ms, transform 480ms cubic-bezier(.2,.7,.2,1) ${i*26}ms`,
            display: 'inline-block', whiteSpace: 'pre',
          }}>{ch}</span>
        ))}
        <span style={{ width: tracking, display: 'inline-block' }} />
        {'LEVELING'.split('').map((ch, i) => (
          <span key={'l'+i} style={{
            color: white,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(5px)',
            transition: `opacity 420ms cubic-bezier(.2,.7,.2,1) ${(i+6)*26}ms, transform 480ms cubic-bezier(.2,.7,.2,1) ${(i+6)*26}ms`,
            display: 'inline-block', whiteSpace: 'pre',
          }}>{ch}</span>
        ))}
      </div>
    </div>
  );
}

// Big splash variant — large mark above centered wordmark
function SocialLevelingSplash({ scale = 1 }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 * scale,
    }}>
      <SLMark size={92 * scale} rotate shimmer />
      <div style={{
        fontFamily: 'Geist, system-ui', fontWeight: 700, fontSize: 20 * scale,
        letterSpacing: 5.4, display: 'inline-flex',
      }}>
        <span style={{ color: '#D4AF37' }}>SOCIAL</span>
        <span style={{ width: 6 }} />
        <span style={{ color: '#FFFFFF' }}>LEVELING</span>
      </div>
    </div>
  );
}

Object.assign(window, { SLMark, SocialLevelingLogo, SocialLevelingSplash });
