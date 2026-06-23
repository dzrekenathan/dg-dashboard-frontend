import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ShieldCheck, BookOpen, Users } from 'lucide-react'

export function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) { setError(result.message || 'Invalid email or password. Please try again.'); return }
    const session = JSON.parse(localStorage.getItem('clet_session') || '{}')
    navigate(session.role === 'management' ? '/management' : '/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#0A1F3D] relative overflow-hidden px-14 py-12">

        {/* Adinkra watermark grid */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{ backgroundImage: "url('/assets/adinkra-bg-navy.png')", backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.08 }}
        />

        {/* Top: logo + org name */}
        <div className="relative z-10 flex items-center gap-4 mb-auto">
          <img
            src="/assets/clet-logo.png"
            alt="CLET seal"
            className="h-16 w-16 object-contain rounded-full bg-white p-1 shadow-lg"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <div>
            <p className="text-[11px] font-bold text-[#B8943A] uppercase tracking-[0.2em] font-sans">
              Council for Legal Education and Training
            </p>
          </div>
        </div>

        {/* Centre: headline */}
        <div className="relative z-10 mt-16 mb-12">
          <h1 className="font-sans font-bold text-white text-5xl leading-tight max-w-lg">
            Strategic oversight of CLET's implementation goals.
          </h1>
          <p className="mt-5 text-white/60 text-base font-sans leading-relaxed max-w-md">
            The unified dashboard for monitoring Strategic Objectives, tracking task completion, and reporting progress to leadership.
          </p>
        </div>

        {/* Bottom: trust badges */}
        <div className="relative z-10 flex items-center gap-6 mt-auto">
          {[
            { icon: ShieldCheck, label: 'Role-protected' },
            { icon: BookOpen,    label: 'Audit-ready' },
            { icon: Users,       label: 'Multi-user sync' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/50 text-xs font-sans">
              <Icon size={14} className="text-[#B8943A]" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] flex-shrink-0 flex items-center justify-center bg-white dark:bg-[#0F1623] relative">

        {/* Mobile: faint Adinkra bg */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{ backgroundImage: "url('/assets/adinkra-bg-navy.png')", backgroundRepeat: 'repeat', backgroundSize: '180px', opacity: 0.04 }}
        />

        <div className="relative z-10 w-full max-w-sm px-8 py-10">

          {/* Card top accent line */}
          <div className="h-1 w-16 rounded-full bg-[#B8943A] mb-8" />

          {/* Brand header */}
          <div className="flex items-center gap-3 mb-1">
            <img
              src="/assets/clet-logo.png"
              alt="CLET"
              className="h-9 w-9 object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p className="font-sans font-bold text-[#0A1F3D] dark:text-white text-sm leading-none">CLET M&amp;E Dashboard</p>
              <p className="text-[10px] text-[#B8943A] font-sans mt-0.5">Authorised institutional access</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E8ECF2] dark:border-white/10 my-5" />

          {/* Form heading */}
          <p className="text-[10px] font-bold text-[#B8943A] uppercase tracking-[0.18em] font-sans mb-2">
            Secure Institutional Access
          </p>
          <h2 className="font-sans font-bold text-[#0A1F3D] dark:text-white text-3xl mb-2">Sign in</h2>
          <p className="text-xs text-[#6B7280] dark:text-white/50 font-sans leading-relaxed mb-7">
            Use your authorised CLET account to access the monitoring portal and programme dashboards.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
                placeholder=""
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
                  placeholder=""
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#0A1F3D] focus:ring-[#0A1F3D] accent-[#0A1F3D]"
                />
                <span className="text-xs text-[#6B7280] dark:text-white/50 font-sans">Keep me signed in</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-[#0A1F3D] dark:text-[#B8943A] font-semibold hover:underline font-sans">
                Forgot password?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-red-700 dark:text-red-400 text-xs font-sans leading-snug">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#0A1F3D] hover:bg-[#14305C] dark:hover:bg-[#1a3a6b] text-white font-semibold text-sm font-sans transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md mt-1"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in securely'}
            </button>
          </form>

          {/* Sign-up link */}
          <p className="text-center text-xs text-[#6B7280] dark:text-white/40 font-sans mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#0A1F3D] dark:text-[#B8943A] font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Footer note */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-[#9CA3AF] dark:text-white/30 font-sans">
            <ShieldCheck size={11} className="flex-shrink-0" />
            Access attempts and activity may be logged.
          </div>
        </div>
      </div>

    </div>
  )
}
