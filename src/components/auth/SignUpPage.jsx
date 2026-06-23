import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ShieldCheck, BookOpen, Users } from 'lucide-react'

const DIRECTORATES = [
  { code: 'GSL',  label: 'General Secretary & Leadership' },
  { code: 'CDT',  label: 'Curriculum Development & Training' },
  { code: 'AQAI', label: 'Accreditation, Quality Assurance & Inspectorate' },
  { code: 'LRKS', label: 'Legal Research, Knowledge & Standards' },
  { code: 'DTI',  label: 'Digital Transformation & Infrastructure' },
  { code: 'CCP',  label: 'Communications, Campaigns & Public Affairs' },
  { code: 'P&C',  label: 'People & Culture' },
  { code: 'RMF',  label: 'Resource Management & Finance' },
  { code: 'SF&L', label: 'Student, Faculty & Learning' },
  { code: 'C&A',  label: 'Compliance & Administration' },
]

export function SignUpPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [directorate, setDirectorate] = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (!directorate)         { setError('Please select your directorate.'); return }

    setLoading(true)
    const result = await register(name, email, password, directorate)
    setLoading(false)

    if (!result.ok) { setError(result.message); return }
    navigate('/management', { replace: true })
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
            Join the CLET M&amp;E team.
          </h1>
          <p className="mt-5 text-white/60 text-base font-sans leading-relaxed max-w-md">
            Create your account to access your directorate's thematic areas, track tasks, and contribute to CLET's strategic objectives.
          </p>
        </div>

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
      <div className="w-full lg:w-[520px] flex-shrink-0 flex items-center justify-center bg-white dark:bg-[#0F1623] relative overflow-auto py-10">
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{ backgroundImage: "url('/assets/adinkra-bg-navy.png')", backgroundRepeat: 'repeat', backgroundSize: '180px', opacity: 0.04 }}
        />

        <div className="relative z-10 w-full max-w-sm px-8">

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

          <p className="text-[10px] font-bold text-[#B8943A] uppercase tracking-[0.18em] font-sans mb-2">Create Account</p>
          <h2 className="font-sans font-bold text-[#0A1F3D] dark:text-white text-3xl mb-2">Sign up</h2>
          <p className="text-xs text-[#6B7280] dark:text-white/50 font-sans leading-relaxed mb-7">
            All new accounts are registered as management users and scoped to a single directorate.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="e.g. Kwame Asante"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
              />
            </div>

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
                placeholder="you@ramahupliftment.org"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
              />
            </div>

            {/* Directorate */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                Directorate
              </label>
              <select
                value={directorate}
                onChange={e => setDirectorate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-[#1a2235] text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition"
              >
                <option value="" disabled>Select your directorate…</option>
                {DIRECTORATES.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.label}</option>
                ))}
              </select>
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

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-white/70 mb-1.5 font-sans">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#D1D5DB] dark:border-white/10 bg-white dark:bg-white/5 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F3D] dark:focus:ring-[#B8943A] focus:border-transparent transition placeholder:text-[#9CA3AF]"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>

          {/* Link to login */}
          <p className="text-center text-xs text-[#6B7280] dark:text-white/40 font-sans mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0A1F3D] dark:text-[#B8943A] font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-[#9CA3AF] dark:text-white/30 font-sans">
            <ShieldCheck size={11} className="flex-shrink-0" />
            Access attempts and activity may be logged.
          </div>
        </div>
      </div>

    </div>
  )
}
