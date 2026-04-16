import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { signIn, signUp } from '../../lib/auth'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'signin' | 'signup'

export default function Auth() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in — skip to the right place
  useEffect(() => {
    if (!loading && session) {
      navigate(localStorage.getItem('onboarded') ? '/home' : '/', { replace: true })
    }
  }, [session, loading, navigate])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setEmail('')
    setPassword('')
    setUsername('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && !username.trim()) {
      setError('Username is required')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, username.trim())
        // New user → onboarding
        navigate('/', { replace: true })
      } else {
        await signIn(email, password)
        // Existing user → skip onboarding if already done
        navigate(localStorage.getItem('onboarded') ? '/home' : '/', { replace: true })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Desktop: centered card; Mobile: full screen */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* ── Logo ── */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center mb-12"
          >
            <div className="font-['Unbounded'] font-bold text-white leading-none mb-3"
              style={{ fontSize: 'clamp(56px, 15vw, 72px)' }}>
              ◈
            </div>
            <div className="font-['Unbounded'] font-bold text-white text-[10px] tracking-[0.22em] opacity-60">
              INNER CIRCLE
            </div>
          </motion.div>

          {/* ── Mode toggle ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex bg-[#111111] rounded-xl p-1 mb-6 border border-white/5"
          >
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-['Outfit'] font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </motion.div>

          {/* ── Form ── */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {/* Username (sign up only) */}
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full bg-[#111111] border border-white/8 rounded-xl px-4 py-3.5 text-white font-['DM_Sans'] text-[15px] placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full bg-[#111111] border border-white/8 rounded-xl px-4 py-3.5 text-white font-['DM_Sans'] text-[15px] placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                className="w-full bg-[#111111] border border-white/8 rounded-xl px-4 py-3.5 pr-12 text-white font-['DM_Sans'] text-[15px] placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="font-['DM_Sans'] text-[#E63946] text-sm text-center pt-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-white text-black font-['Outfit'] font-bold text-base tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting
                ? mode === 'signup' ? 'Creating account…' : 'Signing in…'
                : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </motion.form>

          {/* Sub-text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center font-['DM_Sans'] text-white/20 text-xs mt-6"
          >
            {mode === 'signup'
              ? 'Already have an account? '
              : "Don't have an account? "}
            <button
              onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
              className="text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </motion.p>
        </div>
      </div>
    </div>
  )
}
