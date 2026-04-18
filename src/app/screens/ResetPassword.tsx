import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { updatePassword } from '../../lib/auth'
import { toast } from 'sonner'

export default function ResetPassword() {
  const navigate = useNavigate()

  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const accessToken = hashParams.get('access_token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // No token in URL — the link is broken or already used
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[380px] text-center">
          <div className="w-20 h-20 rounded-full bg-[#E63946]/15 border-2 border-[#E63946]/40 flex items-center justify-center mx-auto mb-6">
            <span className="font-['Outfit'] font-extrabold text-[#E63946] text-3xl leading-none">✕</span>
          </div>
          <h1 className="font-['Unbounded'] font-bold text-white text-xl leading-snug mb-3">
            Invalid link
          </h1>
          <p className="font-['DM_Sans'] text-white/40 text-sm leading-relaxed mb-8">
            This reset link is missing or has already been used. Request a new one from the sign-in screen.
          </p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full py-4 rounded-2xl bg-white text-black font-['Outfit'] font-bold text-base tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      await updatePassword(password, accessToken)
      toast.success('Password updated — please sign in')
      navigate('/auth', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center mb-12"
          >
            <div
              className="font-['Unbounded'] font-bold text-white leading-none mb-3"
              style={{ fontSize: 'clamp(56px, 15vw, 72px)' }}
            >
              ◈
            </div>
            <div className="font-['Unbounded'] font-bold text-white text-[10px] tracking-[0.22em] opacity-60">
              SOCIAL LEVELING
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="font-['Unbounded'] font-bold text-white text-base mb-1.5">
              Set new password
            </h2>
            <p className="font-['DM_Sans'] text-white/40 text-sm">
              Choose a strong password for your account.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {/* New password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                autoFocus
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

            {/* Confirm password */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full bg-[#111111] border border-white/8 rounded-xl px-4 py-3.5 pr-12 text-white font-['DM_Sans'] text-[15px] placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-white text-black font-['Outfit'] font-bold text-base tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center font-['DM_Sans'] text-white/20 text-xs mt-6"
          >
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
            >
              Back to sign in
            </button>
          </motion.p>
        </div>
      </div>
    </div>
  )
}
