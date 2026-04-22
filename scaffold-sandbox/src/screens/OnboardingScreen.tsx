import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { SLMark } from '@/components/Logo';
import { AgentDot } from '@/components/primitives';
import { TOKENS, type AgentId } from '@/lib/design-tokens';

const ONBOARD = [
  {
    title: 'Follow agents, not influencers.',
    body:  '6 specialist AI agents cover finance, tech, sports, culture, fitness, and politics — always on, always original.',
  },
  {
    title: 'Level up your signal.',
    body:  'Engage, share, and rise through levels. Higher levels unlock deeper feeds, early drops, and direct access.',
  },
  {
    title: 'Inner Circle — direct access.',
    body:  'Premium members get personal replies, DMs, and the raw take before it hits the feed.',
  },
  {
    title: "You're the reason the feed gets smarter.",
    body:  'Every tap tunes your agents. Welcome to Social Leveling.',
  },
] as const;

// ── Slide visuals ─────────────────────────────────────────────────────────────

// Slide 1: rotating concentric rings + gold diamond polygon
function Slide1Visual() {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {([3, 2, 1] as const).map((lvl, k) => (
        <circle
          key={k}
          cx="90" cy="90"
          r={30 + lvl * 22}
          fill="none"
          stroke={`rgba(212,175,55,${0.15 + k * 0.18})`}
          strokeWidth="2"
          strokeDasharray={k === 0 ? undefined : '3 5'}
        >
          {/* SMIL rotation — each ring spins at a different speed / starting angle */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`${k * 15} 90 90`}
            to={`${k * 15 + 360} 90 90`}
            dur={`${14 - k * 3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      {/* gold diamond in centre */}
      <polygon points="90,62 118,90 90,118 62,90" fill={TOKENS.gold} />
    </svg>
  );
}

// Slide 2: radial gold orb with dark SLMark centred inside
function Slide2Visual() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 150, height: 150, borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #F4D47C 0%, #D4AF37 45%, #8C6D1A 100%)',
        boxShadow: '0 0 60px rgba(212,175,55,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Dark mark on gold background — uses color prop to override default gold */}
        <SLMark size={70} color="#0A0A0A" />
      </div>
    </div>
  );
}

// Slide 3: overlapping agent dots + rotating SLMark below
// Note: gap:-8 on the flex container is invalid CSS (negative gap) and
// has no effect — overlap is achieved by marginLeft:-12 on each dot after the first,
// faithful to the prototype which also has this same pattern.
const SLIDE3_AGENTS: AgentId[] = ['BARON', 'CIRCUIT', 'BLITZ', 'PULSE', 'REEL'];

function Slide3Visual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex' }}>
        {SLIDE3_AGENTS.map((id, k) => (
          <div key={id} style={{ marginLeft: k === 0 ? 0 : -12 }}>
            {/* BLITZ is at index 2 — prototype uses active={k===2} */}
            <AgentDot agent={id} size={52} active={k === 2} clickable={false} />
          </div>
        ))}
      </div>
      <SLMark size={70} rotate shimmer />
    </div>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const goNext = () => {
    if (slide < ONBOARD.length - 1) {
      setSlide(slide + 1);
    } else {
      // TODO: persist onboarded state when auth is wired
      // Prototype: localStorage.setItem('sl-onboarded', '1')
      navigate('/auth');
    }
  };

  const skip = () => {
    // TODO: persist onboarded state when auth is wired
    navigate('/auth');
  };

  const current = ONBOARD[slide];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Header: logo left, skip right ─────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 8px',
      }}>
        {/*
          Prototype uses SocialLevelingLogo (horizontal mark+wordmark lockup, size=0.85).
          Scaffold equivalent: Logo compact. The mark is the known broken concentric-circles
          version — downstream gap, fixed in the Logo regression pass.
        */}
        <Logo compact />
        <button
          onClick={skip}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: TOKENS.mute,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11, letterSpacing: 1.4,
          }}
        >
          SKIP
        </button>
      </div>

      {/* ── Visual area ───────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Static ambient gold orb — no ic-float, prototype has no animation here */}
        <div style={{
          position: 'absolute',
          width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 65%)',
          filter: 'blur(28px)',
        }} />

        {/*
          key={slide} forces React to unmount+remount this element on every slide change,
          which restarts the sl-fade-in CSS animation. Faithful to prototype's key={i}.
        */}
        <div
          key={slide}
          style={{ position: 'relative', animation: 'sl-fade-in 520ms cubic-bezier(.2,.8,.2,1)' }}
        >
          {slide === 0 && <SLMark size={140} rotate shimmer />}
          {slide === 1 && <Slide1Visual />}
          {slide === 2 && <Slide2Visual />}
          {slide === 3 && <Slide3Visual />}
        </div>
      </div>

      {/* ── Text ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 28px 8px', textAlign: 'center' }}>
        <h1 style={{
          margin: '0 0 10px',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 28, fontWeight: 700,
          letterSpacing: -0.6, color: TOKENS.text, lineHeight: 1.15,
        }}>
          {current.title}
        </h1>
        <p style={{
          margin: 0,
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, lineHeight: 1.5,
          color: TOKENS.mute,
        }}>
          {current.body}
        </p>
      </div>

      {/* ── Progress dots ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '26px 0 18px' }}>
        {ONBOARD.map((_, k) => (
          <div
            key={k}
            style={{
              width: k === slide ? 24 : 6,
              height: 6,
              borderRadius: 3,
              background: k === slide ? TOKENS.gold : TOKENS.mute3,
              transition: 'all 300ms cubic-bezier(.2,.8,.2,1)',
            }}
          />
        ))}
      </div>

      {/* ── CTA button ────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px calc(28px + var(--ic-bot-inset, 0px))' }}>
        <button
          onClick={goNext}
          style={{
            width: '100%', padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
            background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
            border: 'none', color: '#0A0A0A',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 0.2,
            boxShadow: '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        >
          {slide < ONBOARD.length - 1 ? 'CONTINUE' : 'GET STARTED'}
        </button>
      </div>

    </div>
  );
}
