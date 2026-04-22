// primitives.jsx — animated reusable primitives

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// useSpring — simple spring towards a target
// ─────────────────────────────────────────────────────────────
function useSpring(target, { stiffness = 170, damping = 26, precision = 0.01 } = {}) {
  const [val, setVal] = useState(target);
  const ref = useRef({ pos: target, vel: 0, target });
  useEffect(() => { ref.current.target = target; }, [target]);
  useEffect(() => {
    let raf;
    const tick = () => {
      const s = ref.current;
      const dx = s.target - s.pos;
      const ax = stiffness * dx - damping * s.vel;
      s.vel += ax * (1 / 60);
      s.pos += s.vel * (1 / 60);
      if (Math.abs(dx) < precision && Math.abs(s.vel) < precision) {
        s.pos = s.target; s.vel = 0;
        setVal(s.pos);
        return;
      }
      setVal(s.pos);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, stiffness, damping, precision]);
  return val;
}

// ─────────────────────────────────────────────────────────────
// Odometer — animated count
// ─────────────────────────────────────────────────────────────
function Odometer({ value, format = (n) => n.toLocaleString(), duration = 900, style }) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef({ from: value, to: value, t0: performance.now() });
  useEffect(() => {
    startRef.current = { from: display, to: value, t0: performance.now() };
    let raf;
    const tick = () => {
      const { from, to, t0 } = startRef.current;
      const t = Math.min(1, (performance.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{format(Math.round(display))}</span>;
}

function fmtCompact(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return String(n);
}

// ─────────────────────────────────────────────────────────────
// LivePulse — three-dot staggered pulse
// ─────────────────────────────────────────────────────────────
function LivePulse({ color = '#E63946', label = 'LIVE', style }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'Geist Mono, ui-monospace, monospace',
      fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
      color, ...style,
    }}>
      <span style={{ position: 'relative', width: 6, height: 6 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: color, animation: 'ic-pulse 1.4s ease-out infinite',
        }} />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        }} />
      </span>
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AgentDot — circular agent avatar with optional glow
// ─────────────────────────────────────────────────────────────
function AgentDot({ agent, size = 40, active = false, onClick, style, clickable = true }) {
  const A = AGENTS[agent];
  if (!A) return null;
  const isAll = agent === 'ALL';
  const Tag = clickable ? 'button' : 'span';
  const tagProps = clickable
    ? { onClick, type: 'button', 'aria-label': A.name }
    : {};
  // premium dot: conic gradient ring + inner radial + specular highlight + ambient glow
  const gradId = `agd-${agent}-${size}`;
  return (
    <Tag
      {...tagProps}
      style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        border: 'none', padding: 0, cursor: clickable && onClick ? 'pointer' : 'default',
        background: 'transparent', flexShrink: 0,
        display: 'inline-block',
        ...style,
      }}
    >
      {/* ambient glow */}
      <span style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        background: `radial-gradient(circle, ${A.color}66 0%, transparent 65%)`,
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.55)',
        transition: 'opacity 320ms ease, transform 320ms ease',
        animation: active ? 'ic-glow 2.4s ease-in-out infinite' : 'none',
        pointerEvents: 'none', filter: 'blur(2px)',
      }} />
      {/* rotating conic accent ring when active */}
      <span style={{
        position: 'absolute', inset: -3, borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${A.color} 0%, transparent 35%, ${A.color}88 70%, ${A.color} 100%)`,
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.9)',
        transition: 'opacity 280ms ease, transform 280ms cubic-bezier(.2,.9,.3,1.2)',
        animation: active ? 'sl-spin 6s linear infinite' : 'none',
        WebkitMaskImage: 'radial-gradient(circle, transparent 58%, #000 60%, #000 100%)',
                maskImage: 'radial-gradient(circle, transparent 58%, #000 60%, #000 100%)',
        pointerEvents: 'none',
      }} />
      {/* base dot */}
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: isAll
          ? 'radial-gradient(circle at 32% 28%, #ffffff 0%, #e8e8ec 40%, #8d8d94 100%)'
          : `radial-gradient(circle at 32% 28%, ${A.color}ff 0%, ${A.color}cc 55%, ${A.color}66 100%)`,
        boxShadow: `
          inset 0 1.5px 1px rgba(255,255,255,0.55),
          inset 0 -10px 18px rgba(0,0,0,0.38),
          inset 0 0 0 1px rgba(255,255,255,0.08),
          0 4px 12px ${isAll ? 'rgba(0,0,0,0.4)' : A.color + '44'}
        `,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#0A0A0A',
        fontFamily: 'Geist, system-ui, sans-serif',
        fontSize: size * 0.42, fontWeight: 700, letterSpacing: -0.5,
      }}>
        {/* specular highlight */}
        <span style={{
          position: 'absolute', top: '8%', left: '14%', width: '52%', height: '34%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, transparent 70%)',
          pointerEvents: 'none', filter: 'blur(2px)',
        }} />
        <span style={{ position: 'relative', zIndex: 1 }}>{A.letter}</span>
      </span>
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────
// PlaceholderImg — branded agent-colored "image" placeholder
// uses SVG patterns based on post.img kind
// ─────────────────────────────────────────────────────────────
function PlaceholderImg({ kind = 'grid', agent = 'ALL', style, height = 220, label }) {
  const A = AGENTS[agent] || AGENTS.ALL;
  const c = A.color;

  const patterns = {
    chart: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${agent}-chart`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.32" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill="#0B0B0B" />
        {/* grid */}
        {[40, 80, 120, 160].map(y => (
          <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
        ))}
        {[80, 160, 240, 320].map(x => (
          <line key={x} x1={x} x2={x} y1="0" y2="220" stroke="rgba(255,255,255,0.04)" />
        ))}
        <path d="M0,160 L40,140 L80,150 L120,110 L160,130 L200,90 L240,70 L280,100 L320,60 L360,40 L400,55 L400,220 L0,220 Z"
              fill={`url(#g-${agent}-chart)`} />
        <path d="M0,160 L40,140 L80,150 L120,110 L160,130 L200,90 L240,70 L280,100 L320,60 L360,40 L400,55"
              fill="none" stroke={c} strokeWidth="2" />
        <circle cx="360" cy="40" r="4" fill={c}>
          <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    grid: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <defs>
          <radialGradient id={`g-${agent}-grid`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={c} stopOpacity="0.55" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 10 }).map((_, i) =>
          Array.from({ length: 18 }).map((_, j) => {
            const x = j * 22 + 11, y = i * 22 + 11;
            const dx = x - 200, dy = y - 110;
            const d = Math.sqrt(dx*dx + dy*dy);
            const s = Math.max(0, 1 - d / 180);
            return <rect key={`${i}-${j}`} x={x - 8} y={y - 8} width="16" height="16"
              fill={c} opacity={s * 0.6} rx="2" />;
          })
        )}
        <rect width="400" height="220" fill={`url(#g-${agent}-grid)`} style={{ mixBlendMode: 'screen' }} />
      </svg>
    ),
    field: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <circle cx="200" cy="110" r="60" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="200" cy="110" r="4" fill={c} />
        <line x1="200" y1="0" x2="200" y2="220" stroke={c} strokeOpacity="0.2" strokeWidth="1" />
        <rect x="0" y="60" width="60" height="100" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="340" y="60" width="60" height="100" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="0" y="85" width="20" height="50" fill="none" stroke={c} strokeOpacity="0.5" strokeWidth="1.5" />
        <rect x="380" y="85" width="20" height="50" fill="none" stroke={c} strokeOpacity="0.5" strokeWidth="1.5" />
        {/* motion arc */}
        <path d="M60,130 Q150,40 340,100" fill="none" stroke={c} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
        <circle cx="340" cy="100" r="5" fill={c} />
      </svg>
    ),
    wave: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none">
        <rect width="400" height="220" fill="#0B0B0B" />
        {Array.from({ length: 60 }).map((_, i) => {
          const x = i * 7 + 5;
          const h = 20 + Math.abs(Math.sin(i * 0.4 + 1)) * 80 + Math.abs(Math.cos(i * 0.23)) * 40;
          return <rect key={i} x={x} y={(220 - h) / 2} width="3" height={h} fill={c} opacity={0.3 + (i / 60) * 0.6} rx="1" />;
        })}
      </svg>
    ),
    poster: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g-${agent}-poster`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B0B0B" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill={`url(#g-${agent}-poster)`} />
        <circle cx="280" cy="110" r="80" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        <circle cx="280" cy="110" r="50" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <circle cx="280" cy="110" r="20" fill="rgba(0,0,0,0.4)" />
        <text x="24" y="200" fill="rgba(0,0,0,0.6)" fontFamily="Geist Mono, monospace" fontSize="10" letterSpacing="2">A24 / 2026</text>
      </svg>
    ),
    dome: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <path d="M200,40 Q280,40 280,130 L280,180 L120,180 L120,130 Q120,40 200,40 Z"
              fill="none" stroke={c} strokeWidth="1.5" opacity="0.7" />
        <path d="M160,180 L160,100 M180,180 L180,100 M200,180 L200,90 M220,180 L220,100 M240,180 L240,100"
              stroke={c} strokeWidth="1.5" opacity="0.6" />
        <line x1="80" y1="180" x2="320" y2="180" stroke={c} strokeWidth="2" />
        <circle cx="200" cy="35" r="3" fill={c} />
      </svg>
    ),
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height, overflow: 'hidden',
      background: '#0B0B0B', ...style,
    }}>
      {patterns[kind] || patterns.grid}
      {/* subtle grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at top, transparent 60%, rgba(0,0,0,0.55) 100%)',
      }} />
      {label && (
        <div style={{
          position: 'absolute', bottom: 10, left: 14,
          fontFamily: 'Geist Mono, monospace', fontSize: 9,
          color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5,
        }}>{label}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sparkline — small animated line
// ─────────────────────────────────────────────────────────────
function Sparkline({ points, color, width = 60, height = 20 }) {
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

Object.assign(window, {
  useSpring, Odometer, fmtCompact, LivePulse, AgentDot, PlaceholderImg, Sparkline,
});
