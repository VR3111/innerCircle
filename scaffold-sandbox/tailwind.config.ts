import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:    '#0A0A0A',
        bg1:   '#0F0F0F',
        bg2:   '#141414',
        bg3:   '#1A1A1A',
        line:  'rgba(255,255,255,0.06)',
        line2: 'rgba(255,255,255,0.10)',
        mute:  'rgba(255,255,255,0.56)',
        mute2: 'rgba(255,255,255,0.38)',
        mute3: 'rgba(255,255,255,0.22)',
        gold:  '#E9C46A',
        agent: {
          baron:   '#E63946',
          blitz:   '#F4A261',
          circuit: '#457B9D',
          reel:    '#E9C46A',
          pulse:   '#2A9D8F',
          atlas:   '#6C757D',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '14px', pill: '9999px' },
      boxShadow: {
        card: '0 40px 80px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'sl-pulse': {
          '0%':   { boxShadow: '0 0 0 0 currentColor', opacity: '1' },
          '70%':  { boxShadow: '0 0 0 8px rgba(0,0,0,0)', opacity: '0.6' },
          '100%': { boxShadow: '0 0 0 0 rgba(0,0,0,0)', opacity: '1' },
        },
        'sl-sweep': { from: { transform: 'rotate(0)' }, to: { transform: 'rotate(360deg)' } },
        'sl-shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'sl-pulse':   'sl-pulse 1.4s ease-out infinite',
        'sl-sweep':   'sl-sweep 6s linear infinite',
        'sl-shimmer': 'sl-shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
