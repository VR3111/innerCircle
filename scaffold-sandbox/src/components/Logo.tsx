import { motion } from 'motion/react';

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
