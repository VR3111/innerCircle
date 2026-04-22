import { motion, animate, useMotionValue, useTransform } from 'motion/react';
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

  return <motion.span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</motion.span>;
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
 * AgentDot — one signature animation (conic spin) when active
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
      {active && (
        <motion.span
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -3,
            background: `conic-gradient(from 0deg, ${A.color}00 0deg, ${A.color} 120deg, ${A.color}00 360deg)`,
            WebkitMask: 'radial-gradient(circle, transparent calc(50% - 2px), black calc(50% - 1px))',
            mask: 'radial-gradient(circle, transparent calc(50% - 2px), black calc(50% - 1px))',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3.6, ease: 'linear', repeat: Infinity }}
        />
      )}
      <span
        className="absolute inset-0 rounded-full flex items-center justify-center font-sans font-bold text-bg"
        style={{
          background: isAll
            ? 'linear-gradient(135deg,#fff 0%,#9a9a9a 100%)'
            : `linear-gradient(135deg, ${A.color} 0%, ${A.color}cc 100%)`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -8px 12px rgba(0,0,0,0.25)',
          fontSize: size * 0.4,
          letterSpacing: '-0.5px',
        }}
      >
        {A.letter}
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
 * PlaceholderImg — branded agent-colored SVG patterns
 * ──────────────────────────────────────────────── */
type PlaceholderKind = 'chart' | 'grid' | 'field' | 'wave' | 'poster' | 'dome';
export function PlaceholderImg({
  kind = 'grid', agent = 'ALL', height = 220, className = '',
}: { kind?: PlaceholderKind; agent?: AgentId; height?: number | string; className?: string }) {
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
        {[40, 80, 120, 160].map(y => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />)}
        <path d="M0,160 L40,140 L80,150 L120,110 L160,130 L200,90 L240,70 L280,100 L320,60 L360,40 L400,55 L400,220 L0,220 Z" fill={`url(#g-${id})`} />
        <path d="M0,160 L40,140 L80,150 L120,110 L160,130 L200,90 L240,70 L280,100 L320,60 L360,40 L400,55" fill="none" stroke={c} strokeWidth="2" />
      </svg>
    ),
    grid: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
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
      </svg>
    ),
    field: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <circle cx="200" cy="110" r="60" fill="none" stroke={c} strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="200" cy="110" r="4" fill={c} />
        <line x1="200" y1="0" x2="200" y2="220" stroke={c} strokeOpacity="0.2" />
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
          <linearGradient id={`g-${id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B0B0B" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill={`url(#g-${id})`} />
        <circle cx="280" cy="110" r="80" fill="none" stroke="rgba(0,0,0,0.3)" />
        <circle cx="280" cy="110" r="20" fill="rgba(0,0,0,0.4)" />
      </svg>
    ),
    dome: (
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="220" fill="#0B0B0B" />
        <path d="M200,40 Q280,40 280,130 L280,180 L120,180 L120,130 Q120,40 200,40 Z" fill="none" stroke={c} strokeWidth="1.5" opacity="0.7" />
        <line x1="80" y1="180" x2="320" y2="180" stroke={c} strokeWidth="2" />
      </svg>
    ),
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#0B0B0B] ${className}`} style={{ height }}>
      {patterns[kind]}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, transparent 60%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  );
}
