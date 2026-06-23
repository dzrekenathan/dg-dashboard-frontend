import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'

// Step 1 → request token, Step 2 → set new password, done → success
export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep]           = useState('email') // 'email' | 'reset' | 'done'
  const [email, setEmail]         = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/auth/forgot-password', { email })
      setResetToken(data.reset_token)
      setStep('reset')
    } catch (err) {
      setError(err.message || 'No account found with that email address.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm)  { setError('Passwords do not match.'); return }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { reset_token: resetToken, new_password: password })
      setStep('done')
    } catch (err) {
      setError(err.message || 'Reset failed. Please start over.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#0A1F3D] relative overflow-hidden px-14 py-12">
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{ backgroundImage: "url('/assets/adinkra-bg-navy.png')", backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.08 }}
        />
        <div className="relative z-10 flex items-center gap-4 mb-auto">
          <img src="/assets/clet-logo.png" alt="CLET seal"
            className="h-16 w-16 object-contain rounded-full bg-white p-1 shadow-lg"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <p className="text-[11px] font-bold text-[#B8943A] uppercase tracking-[0.2em] font-sans">
            Council for Legal Education and Training
          </p>
        </div>

        <div className="relative z-10 mt-16 mb-12">
          <h1 className="font-sans font-bold text-white text-5xl leading-tight max-w-lg">
            {step === 'done' ? 'You\'re back in.' : 'Reset your password.'}
          </h1>
          <p className="mt-5 text-white/60 text-base font-sans leading-relaxed max-w-md">
            {step === 'done'
              ? 'Your password has been updated. Sign in with your new credentials to continue.'
              : 'Enter your registered email to receive a secure reset link, then set your new password.'}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 mt-auto">
          <div className="flex items-center gap-2 text-white/50 text-xs font-sans">
            <ShieldCheck size={14} className="text-[#B8943A]" />
            15-minute reset window
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] flex-shrink-0 flex items-center justify-center bg-white dark:bg-[#0F1623] relative">
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{ backgroundImage: "url('/assets/adinkra-bg-navy.png')", backgroundRepeat: 'repeat', backgroundSize: '180px', opacity: 0.04 }}
        />

        <div className="relative z-10 w-full max-w-sm px-8 py-10">

          <div className="h-1 w-16 rounded-full bg-[#B8943A] mb-8" />

          <div className="flex items-center gap-3 mb-1">
            <img src="/assets/clet-logo.png" alt="CLET"
              className="h-9 w-9 object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p className="font-sans font-bold text-[#0A1F3D] dark:text-white text-sm leading-none">CLET M&amp;E Dashboard</p>
              <p className="text-[10px] text-[#B8943A] font-sans mt-0.5">Authorised institutional access</p>
            </div>
          </div>

          <div className="border-t border-[#E8ECF2] dark:border-white/10 my-5" />

          {/* ── STEP: EMAIL ── */}
          {step === 'email' && (
            <>
              <p className="text-[10px] font-bold text-[#B8943A] uppercase tracking-[0.18em] font-sans mb-2">
                Forgot Password
              </p>
              <h2 className="font-sans font-bold text-[#0A1F3D] dark:text-white text-3xl mb-2">Find your account</h2>
              <p className="text-xs text-[#6B7280] dark:text-white/50 font-sans leading-relaxed mb-7">
                Enter the email address linked to your CLET account. We'll generate a secure reset token for you.
              </p>

              <form onSubmit={handleRequestReset} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="you@ramahupliftment.org"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
                    <p className="text-red-700 dark:text-red-400 text-xs font-sans leading-snug">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-[#0A1F3D] hover:bg-[#14305C] dark:hover:bg-[#1a3a6b] text-white font-semibold text-sm font-sans transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Looking up account…
                    </>
                  ) : 'Continue'}
                </button>
              </form>

              <p className="flex items-center gap-1.5 mt-6 text-xs text-[#6B7280] dark:text-white/40 font-sans">
                <ArrowLeft size={12} />
                <Link to="/login" className="hover:text-[#0A1F3D] dark:hover:text-[#B8943A] transition-colors">
                  Back to sign in
                </Link>
              </p>
            </>
          )}

          {/* ── STEP: RESET ── */}
          {step === 'reset' && (
            <>
              <p className="text-[10px] font-bold text-[#B8943A] uppercase tracking-[0.18em] font-sans mb-2">
                New Password
              </p>
              <h2 className="font-sans font-bold text-[#0A1F3D] dark:text-white text-3xl mb-2">Set a new password</h2>
              <p className="text-xs text-[#6B7280] dark:text-white/50 font-sans leading-relaxed mb-7">
                Choose a new password for <strong className="text-[#0A1F3D] dark:text-white">{email}</strong>.
                This reset expires in 15 minutes.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
                    <p className="text-red-700 dark:text-red-400 text-xs font-sans leading-snug">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-[#0A1F3D] hover:bg-[#14305C] dark:hover:bg-[#1a3a6b] text-white font-semibold text-sm font-sans transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating password…
                    </>
                  ) : 'Set new password'}
                </button>
              </form>

              <button
                onClick={() => { setStep('email'); setError('') }}
                className="flex items-center gap-1.5 mt-6 text-xs text-[#6B7280] dark:text-white/40 font-sans hover:text-[#0A1F3D] dark:hover:text-[#B8943A] transition-colors"
              >
                <ArrowLeft size={12} /> Use a different email
              </button>
            </>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 mx-auto mb-5">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-sans font-bold text-[#0A1F3D] dark:text-white text-2xl mb-2">Password updated</h2>
              <p className="text-xs text-[#6B7280] dark:text-white/50 font-sans leading-relaxed mb-8">
                Your new password is active. Sign in to continue where you left off.
              </p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 rounded-lg bg-[#0A1F3D] hover:bg-[#14305C] dark:hover:bg-[#1a3a6b] text-white font-semibold text-sm font-sans transition-all duration-200 shadow-md"
              >
                Go to sign in
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-8 text-[10px] text-[#9CA3AF] dark:text-white/30 font-sans">
            <ShieldCheck size={11} className="flex-shrink-0" />
            Access attempts and activity may be logged.
          </div>
        </div>
      </div>

    </div>
  )
}
