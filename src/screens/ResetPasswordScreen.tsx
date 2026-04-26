import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { updatePassword } from '../lib/auth';
import { TOKENS } from '@/lib/design-tokens';
import { SocialLevelingLogo } from '@/components/Logo';

export function ResetPasswordScreen() {
  const navigate = useNavigate();

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const type = hashParams.get('type');

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hp = new URLSearchParams(window.location.hash.substring(1));
    const token = hp.get('access_token');
    const t = hp.get('type');

    if (!token || t !== 'recovery') {
      setReady(true);
      return;
    }

    // Force-clear any stale session before the recovery token is used.
    localStorage.removeItem('inner-circle-auth');
    localStorage.removeItem('onboarded');

    // Notify AuthContext via storage event (same pattern auth.ts uses for
    // sign-in, but in reverse — newValue: null triggers the sign-out branch).
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'inner-circle-auth',
        newValue: null,
      })
    );

    setReady(true);
  }, []);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!ready) return null;

  // No token in URL or wrong type — the link is broken or already used
  if (!accessToken || type !== 'recovery') {
    return (
      <div
        className="no-scrollbar"
        style={{
          position: 'relative', height: '100%',
          background: TOKENS.bg, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 28px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(230,57,70,0.12)', border: '2px solid rgba(230,57,70,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#E63946" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{
            margin: '0 0 8px', fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 22, fontWeight: 700, color: TOKENS.text,
          }}>Invalid link</h1>
          <p style={{
            margin: '0 0 28px', fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14, lineHeight: 1.5, color: TOKENS.mute,
          }}>
            This reset link is missing or has already been used. Request a new one from the sign-in screen.
          </p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
              background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
              border: 'none', color: '#0A0A0A',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
              boxShadow: '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >BACK TO SIGN IN</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password, accessToken);
      toast.success('Password updated — please sign in');
      navigate('/auth', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="no-scrollbar"
      style={{
        position: 'relative', height: '100%',
        background: TOKENS.bg, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.2, 0.7, 0.2, 1] }}
        style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          maxWidth: 420, width: '100%', margin: '0 auto',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: 'calc(36px + var(--ic-top-inset, 0px)) 28px 14px',
          display: 'flex', justifyContent: 'center',
        }}>
          <SocialLevelingLogo size={1} />
        </div>

        {/* Heading */}
        <div style={{ padding: '22px 28px 0' }}>
          <h1 style={{
            margin: '0 0 6px', fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 26, fontWeight: 700, color: TOKENS.text, letterSpacing: -0.5,
          }}>Set new password</h1>
          <p style={{
            margin: 0, fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14, color: TOKENS.mute,
          }}>Choose a strong password for your account.</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '22px 28px 0', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {/* New password */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 10,
              color: 'rgba(255,255,255,0.55)', letterSpacing: 1.4,
            }}>NEW PASSWORD</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
                style={{
                  width: '100%', padding: '13px 44px 13px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* Confirm password */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 10,
              color: 'rgba(255,255,255,0.55)', letterSpacing: 1.4,
            }}>CONFIRM PASSWORD</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                style={{
                  width: '100%', padding: '13px 44px 13px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowConfirm(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: 0,
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#E63946',
              textAlign: 'center', paddingTop: 2,
            }}>{error}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 10, width: '100%', padding: '16px 20px', borderRadius: 14,
              cursor: submitting ? 'default' : 'pointer',
              background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
              border: 'none', color: '#0A0A0A',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
              boxShadow: submitting
                ? 'none'
                : '0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 200ms',
            }}
          >
            {submitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>

        {/* Back link */}
        <div style={{
          textAlign: 'center', padding: '20px 28px 28px',
        }}>
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12,
              color: TOKENS.mute, textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >Back to sign in</button>
        </div>
      </motion.div>
    </div>
  );
}
