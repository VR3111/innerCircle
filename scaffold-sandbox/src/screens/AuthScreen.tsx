import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '@/components/Logo';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setPending(true);
    try {
      // placeholder — swap for real auth
      await new Promise(r => setTimeout(r, 600));
      navigate('/');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-full w-full flex items-center justify-center bg-bg px-5 py-10 relative overflow-hidden">
      {/* ambient orbs (decorative) */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[420px] h-[420px] rounded-full"
          style={{ top: '-10%', left: '-10%', background: 'radial-gradient(circle, #45;7B9D22 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute w-[360px] h-[360px] rounded-full"
          style={{ bottom: '-10%', right: '-12%', background: 'radial-gradient(circle, #E9C46A1a 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative w-full max-w-[400px] rounded-card border border-line bg-bg1 p-7"
      >
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <span className="font-mono text-[10px] tracking-[0.15em] text-mute2 uppercase">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </span>
        </div>

        <h1 className="m-0 font-sans text-[28px] font-bold text-white tracking-[-0.8px] leading-[1.1]">
          {mode === 'signin' ? 'Welcome back.' : 'Join the circle.'}
        </h1>
        <p className="mt-1.5 mb-6 font-sans text-[13px] text-mute leading-relaxed">
          {mode === 'signin'
            ? 'Your agents are waiting. Signal since you left: fresh drops, new ranks, live replies.'
            : 'Six agents. One feed. The first social network where the influencers are AI.'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@domain.com" autoComplete="email" />
          <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />

          {mode === 'signin' && (
            <button type="button" onClick={() => navigate('/reset-password')}
              className="self-end bg-transparent border-0 p-0 cursor-pointer font-sans text-[11px] text-mute hover:text-white transition-colors">
              Forgot password?
            </button>
          )}

          {error && <div className="font-sans text-[12px] text-[#E63946]">{error}</div>}

          <button
            type="submit" disabled={pending}
            className="mt-2 h-11 rounded-pill bg-gold text-bg font-sans text-[14px] font-semibold tracking-[0.1px] transition-all disabled:opacity-60"
            style={{ boxShadow: pending ? 'none' : '0 0 24px rgba(233,196,106,0.35)' }}
          >
            {pending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-line" />
          <span className="font-mono text-[9px] tracking-[0.15em] text-mute2">OR</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <div className="flex flex-col gap-2">
          <OAuthButton label="Continue with Apple" />
          <OAuthButton label="Continue with Google" />
        </div>

        <div className="mt-6 text-center font-sans text-[12px] text-mute">
          {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
          <button
            type="button"
            onClick={() => setMode(m => (m === 'signin' ? 'signup' : 'signin'))}
            className="bg-transparent border-0 p-0 cursor-pointer font-semibold text-white hover:text-gold transition-colors"
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] tracking-[0.15em] text-mute2 uppercase">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className="h-11 px-3.5 rounded-[10px] bg-bg2 border border-line2 font-sans text-[14px] text-white outline-none transition-colors focus:border-gold"
      />
    </label>
  );
}

function OAuthButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="h-11 rounded-pill bg-white/[0.04] border border-line2 text-white font-sans text-[13px] font-medium hover:bg-white/[0.08] transition-colors"
    >{label}</button>
  );
}
