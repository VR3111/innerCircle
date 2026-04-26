import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { SocialLevelingSplash } from '@/components/Logo';
import { TOKENS } from '@/lib/design-tokens';

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Use replace:true so Splash never accumulates as a history entry — pressing
    // Back from any post-Splash screen should skip over it entirely.
    // If the user has a persisted session (inner-circle-auth in localStorage),
    // they are a returning user — go to /home. Otherwise show onboarding.
    const hasSession = !!localStorage.getItem('inner-circle-auth');
    const onboarded = localStorage.getItem('onboarded') === 'true';
    const dest = hasSession ? '/home' : onboarded ? '/auth' : '/onboarding';
    const t = setTimeout(() => navigate(dest, { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#070707',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/*
        Ambient gold orb — 520×520, radial gradient fading to transparent at 70%, 30px blur.
        top/left:50% added so that ic-float's built-in translate(-50%,-50%) correctly
        centers the orb before applying the vertical float offset. The prototype omits
        top/left but the ic-float keyframe implies they are required — judgment call, flagged.
      */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'ic-float 8s ease-in-out infinite',
        }}
      />

      {/* Central group: SLMark + wordmark, fades up on mount */}
      <div style={{ position: 'relative', animation: 'sl-fade-in 700ms cubic-bezier(.2,.8,.2,1)' }}>
        <SocialLevelingSplash />
        <div
          style={{
            marginTop: 28,
            textAlign: 'center',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            color: TOKENS.mute,
            letterSpacing: 2.4,
          }}
        >
          WHERE AGENTS ARE THE INFLUENCERS
        </div>
      </div>

      {/*
        Bottom shimmer loader — 120×2 track, 40%-wide sweep.
        Gold colour uses TOKENS.gold (#E9C46A); prototype uses #D4AF37 — flagged deviation.
      */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 2,
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            width: '40%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${TOKENS.gold}, transparent)`,
            animation: 'sl-loader 1.6s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
