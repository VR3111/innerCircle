// AuthScreen — faithful port of prototype-source/screen-auth.jsx
// Cherry-pick approach: prototype layout/visuals restored; scaffold's functional
// improvements (form validation, keyboard submit, autoComplete, error state,
// functional Forgot password, async/await) all kept.
//
// Fixes applied vs prior scaffold version:
//   H1  navigate('/home', replace) — was navigate('/') → auth redirect loop
//   H2  localStorage.setItem('sl-auth','1') added before navigate
//   H3  CSS syntax error (#45;7B9D22) eliminated (orbs replaced wholesale)
//   H4  Single centered gold orb (prototype L29-32) replaces wrong-color pair
//   M1  Full-screen layout — card wrapper removed
//   M2  Gold pill mode toggle restored at top of form
//   M3  Signup headline: "Create your account." (was "Join the circle.")
//   M4  Subheads: prototype copy restored
//   M5  Submit button: gold gradient + borderRadius:14 + fontWeight:700 + Spinner
//   M6  Apple / Google SVG icons restored
//   M7  Terms & Privacy footer restored
//   L5  Input background: rgba(255,255,255,0.03) per prototype (was bg-bg2)

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SocialLevelingLogo } from '@/components/Logo';
import { TOKENS } from '@/lib/design-tokens';
import { signIn, signUp, resetPassword } from '../lib/auth';

type Mode = 'signin' | 'signup';

// ── Spinner ───────────────────────────────────────────────────────────────────
// Ported from prototype-source/screen-auth.jsx L134-141.
// sl-spin keyframe is in globals.css.
function Spinner({ color = '#0A0A0A', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         style={{ animation: 'sl-spin 0.9s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" fill="none"
              stroke={color} strokeOpacity="0.25" strokeWidth="3"/>
      <path d="M21 12a9 9 0 00-9-9"
            stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ── AuthScreen ────────────────────────────────────────────────────────────────
export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpDone, setSignUpDone] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Enter the email address for your account.');
      return;
    }
    setPending(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setPending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (!email.trim() || !username.trim() || password.length < 6) {
        setError('Fill in all fields. Password must be at least 6 characters.');
        return;
      }
    } else {
      // Sign-in: email field accepts email OR username
      if (!email.trim() || password.length < 6) {
        setError('Enter your email/username and a password of at least 6 characters.');
        return;
      }
    }

    setPending(true);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, username.trim());
        // Supabase sends a confirmation email — show success message
        setSignUpDone(true);
      } else {
        // signIn() persists session to localStorage and dispatches StorageEvent.
        // AuthContext picks it up and sets user+session in React state,
        // which triggers RequireAuth to let the user through to /home.
        await signIn(email.trim(), password);
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    // Full-screen scrollable container — height:100% fills MobileLayout's absolute inset-0 wrapper.
    // position:relative anchors the absolute-positioned ambient orb.
    <div
      className="no-scrollbar"
      style={{
        position: 'relative', height: '100%',
        background: TOKENS.bg, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* ── Single centered gold ambient orb (prototype L29-32) ───────────── */}
      {/* Placed at top:50%,left:50% so ic-float's translate(-50%,-50%) centers it */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }}/>

      {/* ── Sign-up confirmation ─────────────────────────────────────────── */}
      {signUpDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.2, 0.7, 0.2, 1] }}
          style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'calc(80px + var(--ic-top-inset, 0px)) 28px 28px',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(212,175,55,0.12)', border: '2px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke={TOKENS.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            margin: '0 0 8px', fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 22, fontWeight: 700, color: TOKENS.text,
          }}>Check your inbox</h1>
          <p style={{
            margin: '0 0 28px', fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14, lineHeight: 1.5, color: TOKENS.mute, maxWidth: 320,
          }}>
            We sent a confirmation link to <strong style={{ color: TOKENS.text }}>{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <button
            type="button"
            onClick={() => { setSignUpDone(false); setMode('signin'); }}
            style={{
              padding: '14px 32px', borderRadius: 14, cursor: 'pointer',
              background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
              border: 'none', color: '#0A0A0A',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
              boxShadow: '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >BACK TO SIGN IN</button>
        </motion.div>
      )}

      {/* ── Forgot password flow ──────────────────────────────────────────── */}
      {!signUpDone && forgotMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.2, 0.7, 0.2, 1] }}
          style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            padding: 'calc(80px + var(--ic-top-inset, 0px)) 28px 28px',
            textAlign: 'center',
          }}
        >
          {resetSent ? (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(212,175,55,0.12)', border: '2px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke={TOKENS.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 style={{
                margin: '0 0 8px', fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 22, fontWeight: 700, color: TOKENS.text,
              }}>Check your email</h1>
              <p style={{
                margin: '0 0 28px', fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14, lineHeight: 1.5, color: TOKENS.mute, maxWidth: 320,
              }}>
                If an account exists for <strong style={{ color: TOKENS.text }}>{email}</strong>,
                we sent a password reset link.
              </p>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                style={{
                  padding: '14px 32px', borderRadius: 14, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
                  border: 'none', color: '#0A0A0A',
                  fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
                }}
              >BACK TO SIGN IN</button>
            </>
          ) : (
            <>
              <h1 style={{
                margin: '0 0 8px', fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 22, fontWeight: 700, color: TOKENS.text,
              }}>Reset your password</h1>
              <p style={{
                margin: '0 0 22px', fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14, lineHeight: 1.5, color: TOKENS.mute, maxWidth: 320,
              }}>
                Enter the email address you used to sign up and we'll send you a reset link.
              </p>
              <form
                onSubmit={handleForgotPassword}
                style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <Field
                  label="Email" value={email} onChange={setEmail}
                  type="email" placeholder="you@domain.com" autoComplete="email"
                />
                {error && (
                  <div style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#E63946',
                  }}>{error}</div>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  style={{
                    marginTop: 6, width: '100%', padding: '16px 20px', borderRadius: 14,
                    cursor: pending ? 'default' : 'pointer',
                    background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
                    border: 'none', color: '#0A0A0A',
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
                    opacity: pending ? 0.7 : 1, transition: 'opacity 200ms',
                    boxShadow: pending ? 'none' : '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
                  }}
                >
                  {pending ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(null); }}
                style={{
                  marginTop: 16, background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12,
                  color: TOKENS.mute, textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >Back to sign in</button>
            </>
          )}
        </motion.div>
      )}

      {/* ── Main content — fade-in (kept from scaffold) ───────────────────── */}
      {!signUpDone && !forgotMode && <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
      >
        {/* Logo — centred, prototype L34-36 padding */}
        <div style={{
          padding: 'calc(36px + var(--ic-top-inset, 0px)) 28px 14px',
          display: 'flex', justifyContent: 'center',
        }}>
          <SocialLevelingLogo size={1} />
        </div>

        {/* Headline + subhead */}
        <div style={{ padding: '22px 28px 0', textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 6px',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 26, fontWeight: 700,
            color: TOKENS.text, letterSpacing: -0.5,
          }}>
            {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
          </h1>
          <p style={{
            margin: 0, color: TOKENS.mute,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
          }}>
            {mode === 'signin' ? 'Pick up where you left off.' : 'Start following the signal.'}
          </p>
        </div>

        {/* ── Gold pill mode toggle (M2: restored from prototype L48-59) ───── */}
        <div style={{
          margin: '22px 28px 0', padding: 4, display: 'flex', borderRadius: 999,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${TOKENS.line}`,
        }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: mode === m ? TOKENS.gold : 'transparent',
                color: mode === m ? '#0A0A0A' : TOKENS.mute,
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.4,
                transition: 'all 240ms cubic-bezier(.2,.8,.2,1)',
                boxShadow: mode === m ? '0 2px 12px rgba(212,175,55,0.3)' : 'none',
              }}
            >
              {m === 'signin' ? 'SIGN IN' : 'SIGN UP'}
            </button>
          ))}
        </div>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form
          onSubmit={submit}
          style={{ padding: '22px 28px 0', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Field
            label={mode === 'signin' ? 'Email or Username' : 'Email'}
            value={email} onChange={setEmail}
            type={mode === 'signin' ? 'text' : 'email'}
            placeholder={mode === 'signin' ? 'you@domain.com or username' : 'you@domain.com'}
            autoComplete="email"
          />
          {mode === 'signup' && (
            <Field
              label="Username" value={username} onChange={setUsername}
              type="text" placeholder="your_username"
              autoComplete="username"
            />
          )}
          <Field
            label="Password" value={password} onChange={setPassword}
            type="password" placeholder="••••••••"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />

          {/* Forgot password — opens inline reset flow */}
          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => { setForgotMode(true); setError(null); }}
              style={{
                alignSelf: 'flex-end', background: 'none', border: 'none',
                cursor: 'pointer', color: TOKENS.gold,
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12,
                padding: 0, marginTop: -4,
              }}
            >Forgot password?</button>
          )}

          {/* Inline error (kept from scaffold) */}
          {error && (
            <div style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#E63946',
            }}>{error}</div>
          )}

          {/* Submit — gold gradient + borderRadius:14 + Spinner (M5: restored) */}
          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: 10, width: '100%', padding: '16px 20px', borderRadius: 14,
              cursor: pending ? 'default' : 'pointer',
              background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
              border: 'none', color: '#0A0A0A',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
              letterSpacing: 0.3,
              boxShadow: pending
                ? 'none'
                : '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
              opacity: pending ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'opacity 200ms',
            }}
          >
            {pending && <Spinner />}
            {pending ? 'PROCESSING' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* ── OR divider ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 28px 0' }}>
          <div style={{ flex: 1, height: 1, background: TOKENS.line }}/>
          <span style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 10,
            color: TOKENS.mute2, letterSpacing: 1.4,
          }}>OR</span>
          <div style={{ flex: 1, height: 1, background: TOKENS.line }}/>
        </div>

        {/* ── Social login buttons — Apple + Google with SVG icons (M6: restored) */}
        <div style={{ padding: '14px 28px 0', display: 'flex', gap: 10 }}>
          <SocialBtn
            label="Apple"
            icon={
              <svg width="14" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.5 12.5c0-3 2.5-4.5 2.6-4.6-1.4-2-3.6-2.3-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-4-1-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.1 1.5 12.1 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 3.9-1 1.9 0 2.4 1 4 1 1.7 0 2.7-1.5 3.7-3 1.2-1.7 1.7-3.4 1.7-3.5-.1 0-3.3-1.3-3.3-5zM14.9 4.4c.8-.9 1.3-2.3 1.2-3.7-1.1 0-2.6.8-3.4 1.7-.8.8-1.4 2.2-1.2 3.6 1.3.1 2.6-.7 3.4-1.6z"/>
              </svg>
            }
          />
          <SocialBtn
            label="Google"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.8h3.7c2.1-2 3.2-4.9 3.2-8.1z"/>
                <path fill="#34A853" d="M12 23c3 0 5.6-1 7.4-2.7l-3.7-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H1.8v2.9C3.6 20.6 7.5 23 12 23z"/>
                <path fill="#FBBC04" d="M5.7 13.9C5.5 13.2 5.3 12.6 5.3 12s.2-1.3.4-1.9V7.2H1.8C1.1 8.7.7 10.3.7 12s.4 3.3 1.1 4.8l3.9-2.9z"/>
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.6 2 14.9 1 12 1 7.5 1 3.6 3.4 1.8 7.2l3.9 2.9C6.6 7.4 9 5.4 12 5.4z"/>
              </svg>
            }
          />
        </div>

        {/* ── Terms & Privacy footer (M7: restored) ─────────────────────────── */}
        <div style={{
          padding: '18px 28px 22px', textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: TOKENS.mute2,
        }}>
          By continuing you agree to our{' '}
          <span style={{ color: TOKENS.mute, textDecoration: 'underline' }}>Terms</span>
          {' '}&amp;{' '}
          <span style={{ color: TOKENS.mute, textDecoration: 'underline' }}>Privacy</span>.
        </div>

        {/* ── Text-link mode switcher (kept from scaffold — coexists with pill) */}
        <div style={{
          textAlign: 'center', paddingBottom: 28,
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: TOKENS.mute,
        }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
          <button
            type="button"
            onClick={() => setMode(m => (m === 'signin' ? 'signup' : 'signin'))}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12,
              fontWeight: 600, color: '#fff',
            }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </div>

      </motion.div>}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
// Input styling matches prototype-source/screen-auth.jsx inputStyle (L115-120).
// Background is rgba(255,255,255,0.03) — translucent, not solid bg-bg2.
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}
function Field({ label, value, onChange, type = 'text', placeholder, autoComplete }: FieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 10,
        color: 'rgba(255,255,255,0.55)', letterSpacing: 1.4,
      }}>
        {label.toUpperCase()}
      </span>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        style={{
          width: '100%', padding: '13px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
          outline: 'none', transition: 'border-color 200ms, box-shadow 200ms',
        }}
      />
    </label>
  );
}

// ── SocialBtn ─────────────────────────────────────────────────────────────────
// Ported from prototype-source/screen-auth.jsx L17-23.
function SocialBtn({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px', borderRadius: 12, cursor: 'pointer',
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${TOKENS.line2}`,
        color: TOKENS.text, fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13, fontWeight: 500,
      }}
    >
      {icon}{label}
    </button>
  );
}
