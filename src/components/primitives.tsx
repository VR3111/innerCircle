import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { AGENTS, type AgentId } from '@/lib/design-tokens';
import { fmtCompact } from '@/lib/mock-data';

/* ────────────────────────────────────────────────
 * Odometer — animate only on value change (not mount)
 * ──────────────────────────────────────────────── */
interface OdometerProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  animateOnMount?: boolean;
  className?: string;
}
export function Odometer({
  value, format = (n) => n.toLocaleString(), duration = 0.9,
  animateOnMount = false, className,
}: OdometerProps) {
  const mv = useMotionValue(animateOnMount ? 0 : value);
  const display = useTransform(mv, (v) => format(Math.round(v)));

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.2, 0.7, 0.2, 1] });
    return () => controls.stop();
  }, [value, duration, mv]);

  return (
    <motion.span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </motion.span>
  );
}

export { fmtCompact };

/* ────────────────────────────────────────────────
 * LivePulse
 * ──────────────────────────────────────────────── */
export function LivePulse({
  color = '#E63946', label = 'LIVE', className = '',
}: { color?: string; label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] ${className}`}
      style={{ color }}
    >
      <span className="relative w-1.5 h-1.5">
        <span className="absolute inset-0 rounded-full animate-sl-pulse" style={{ background: color, color }} />
        <span className="absolute inset-0 rounded-full" style={{ background: color }} />
      </span>
      {label}
    </span>
  );
}

/* ────────────────────────────────────────────────
 * AgentDot — fully restored from prototype-source/primitives.jsx L93–163
 *
 * Layers (bottom to top):
 *   1. ambient glow  — radial blur behind the dot, ic-glow pulsing when active
 *   2. conic ring    — sl-spin rotating accent ring, visible when active
 *   3. base dot      — radial gradient fill + rich box-shadow
 *   4. specular      — small blurred ellipse for 3D gloss (inside base)
 *   5. letter        — agent initial, z-index above specular
 * ──────────────────────────────────────────────── */
interface AgentDotProps {
  agent: AgentId;
  size?: number;
  active?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}
export function AgentDot({
  agent, size = 40, active = false, clickable = true, onClick, className = '',
}: AgentDotProps) {
  const A = AGENTS[agent];
  if (!A) return null;
  const isAll = agent === 'ALL';

  const inner = (
    <>
      {/* 1. Ambient glow — pulsing radial behind the dot when active */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${A.color}66 0%, transparent 65%)`,
          opacity: active ? 1 : 0,
          transform: active ? 'scale(1)' : 'scale(0.55)',
          transition: 'opacity 320ms ease, transform 320ms ease',
          animation: active ? 'ic-glow 2.4s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
          filter: 'blur(2px)',
        }}
      />

      {/* 2. Rotating conic accent ring when active — sl-spin 6s */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${A.color} 0%, transparent 35%, ${A.color}88 70%, ${A.color} 100%)`,
          opacity: active ? 1 : 0,
          transform: active ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 280ms ease, transform 280ms cubic-bezier(.2,.9,.3,1.2)',
          animation: active ? 'sl-spin 6s linear infinite' : 'none',
          WebkitMaskImage: 'radial-gradient(circle, transparent 58%, #000 60%, #000 100%)',
          maskImage: 'radial-gradient(circle, transparent 58%, #000 60%, #000 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3+4+5. Base dot with specular highlight and letter */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: isAll
            ? 'radial-gradient(circle at 32% 28%, #ffffff 0%, #e8e8ec 40%, #8d8d94 100%)'
            : `radial-gradient(circle at 32% 28%, ${A.color}ff 0%, ${A.color}cc 55%, ${A.color}66 100%)`,
          boxShadow: [
            'inset 0 1.5px 1px rgba(255,255,255,0.55)',
            'inset 0 -10px 18px rgba(0,0,0,0.38)',
            'inset 0 0 0 1px rgba(255,255,255,0.08)',
            `0 4px 12px ${isAll ? 'rgba(0,0,0,0.4)' : A.color + '44'}`,
          ].join(', '),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0A0A0A',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: size * 0.42,
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        {/* 4. Specular highlight — blurred ellipse at top-left for 3D gloss */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '8%', left: '14%',
            width: '52%', height: '34%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(2px)',
          }}
        />
        {/* 5. Agent initial, above specular */}
        <span style={{ position: 'relative', zIndex: 1 }}>{A.letter}</span>
      </span>
    </>
  );

  const commonStyle = { width: size, height: size } as const;

  if (clickable) {
    return (
      <button
        type="button" onClick={onClick} aria-label={A.name}
        className={`relative rounded-full border-0 p-0 bg-transparent shrink-0 cursor-pointer ${className}`}
        style={commonStyle}
      >
        {inner}
      </button>
    );
  }
  return (
    <span
      className={`relative inline-block rounded-full shrink-0 ${className}`}
      style={commonStyle}
    >
      {inner}
    </span>
  );
}

/* ────────────────────────────────────────────────
 * Sparkline
 * ──────────────────────────────────────────────── */
export function Sparkline({
  points, color, width = 60, height = 20,
}: { points: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="block">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}

/* ────────────────────────────────────────────────
 * PlaceholderImg — fully restored from prototype-source/primitives.jsx L167–295
 *
 * Additions vs prior scaffold version:
 *   chart  — vertical gridlines + pulsing endpoint circle
 *   grid   — radial gradient overlay with screen blend mode
 *   field  — goal-area rects (4 total)
 *   poster — middle ring (r=50) + A24 text label
 *   dome   — vertical column lines + apex dot
 *   label  — optional text overlay prop
 * ──────────────────────────────────────────────── */
type PlaceholderKind = 'chart' | 'grid' | 'field' | 'wave' | 'poster' | 'dome';
export function PlaceholderImg({
  kind = 'grid', agent = 'ALL', height = 220, className = '', label,
}: {
  kind?: PlaceholderKind;
  agent?: AgentId;
  height?: number | string;
  className?: string;
  label?: string;
}) {
  const A = AGENTS[agent] || AGENTS.ALL;
  const c = A.color;
  const id = `${agent}-${kind}`;

  const patterns: Record<PlaceholderKind, JSX.Element> = {

    chart: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.32" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill="#0B0B0B" />
        {/* horizontal gridlines */}
        {[40, 80, 120, 160].map(y => (
          <line key={`h${y}`} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
        ))}
        {/* vertical gridlines */}
        {[80, 160, 240, 320].map(x => (
          <line key={`v${x}`} x1={x} x2={x} y1="0" y2="220" stroke="rgba(255,255,255,0.04)" />
        ))}
        <path
          d="M0,160 L40,140 L80,150 L120,110 L160,130 L200,90 L240,70 L280,100 L320,60 L360,40 L400,55 L400,220 L0,220 Z"
          fill={`url(#g-${id})`}
        />
        <path
          d="M0,160 L40,140 L80,150 L120,110 L160,130 L200,90 L240,70 L280,100 L320,60 L360,40 L400,55"
          fill="none" stroke={c} strokeWidth="2"
        />
        {/* pulsing endpoint circle */}
        <circle cx="360" cy="40" r="4" fill={c}>
          <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),

    grid: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`g-${id}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={c} stopOpacity="0.55" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="220" fill="#0B0B0B" />
        {Array.from({ length: 10 }).map((_, i) =>
          Array.from({ length: 18 }).map((_, j) => {
            const x = j * 22 + 11, y = i * 22 + 11;
            const dx = x - 200, dy = y - 110;
            const d = Math.sqrt(dx * dx + dy * dy);
            const s = Math.max(0, 1 - d / 180);
            return <rect key={`${i}-${j}`} x={x - 8} y={y - 8} width="16" height="16" fill={c} opacity={s * 0.6} rx="2" />;
          })
        )}
        {/* screen-blend radial overlay — adds depth/glow to the grid */}
        <rect width="400" height="220" fill={`url(#g-${id})`} style={{ mixBlendMode: 'screen' }} />
      </svg>
    ),

    field: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <circle cx="200" cy="110" r="60" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="200" cy="110" r="4" fill={c} />
        <line x1="200" y1="0" x2="200" y2="220" stroke={c} strokeOpacity="0.2" strokeWidth="1" />
        {/* goal areas — outer boxes */}
        <rect x="0"   y="60" width="60" height="100" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="340" y="60" width="60" height="100" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        {/* goal mouths — inner boxes */}
        <rect x="0"   y="85" width="20" height="50" fill="none" stroke={c} strokeOpacity="0.5" strokeWidth="1.5" />
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
          return (
            <rect key={i} x={x} y={(220 - h) / 2} width="3" height={h}
                  fill={c} opacity={0.3 + (i / 60) * 0.6} rx="1" />
          );
        })}
      </svg>
    ),

    poster: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B0B0B" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill={`url(#g-${id})`} />
        <circle cx="280" cy="110" r="80" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        {/* middle ring — restored from prototype */}
        <circle cx="280" cy="110" r="50" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <circle cx="280" cy="110" r="20" fill="rgba(0,0,0,0.4)" />
        {/* A24 credit text — restored from prototype */}
        <text x="24" y="200" fill="rgba(0,0,0,0.6)"
              fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2">
          A24 / 2026
        </text>
      </svg>
    ),

    dome: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <path
          d="M200,40 Q280,40 280,130 L280,180 L120,180 L120,130 Q120,40 200,40 Z"
          fill="none" stroke={c} strokeWidth="1.5" opacity="0.7"
        />
        {/* vertical column lines — restored from prototype */}
        <path
          d="M160,180 L160,100 M180,180 L180,100 M200,180 L200,90 M220,180 L220,100 M240,180 L240,100"
          stroke={c} strokeWidth="1.5" opacity="0.6"
        />
        <line x1="80" y1="180" x2="320" y2="180" stroke={c} strokeWidth="2" />
        {/* apex dot — restored from prototype */}
        <circle cx="200" cy="35" r="3" fill={c} />
      </svg>
    ),
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#0B0B0B] ${className}`} style={{ height }}>
      {patterns[kind]}
      {/* subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, transparent 60%, rgba(0,0,0,0.55) 100%)' }}
      />
      {/* optional text overlay (e.g. agent tag, post label) */}
      {label && (
        <div style={{
          position: 'absolute', bottom: 10, left: 14,
          fontFamily: 'ui-monospace, monospace', fontSize: 9,
          color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5,
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
