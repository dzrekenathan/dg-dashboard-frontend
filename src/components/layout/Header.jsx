import { LogOut, PrinterIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import { useNavigate } from 'react-router-dom'

export function Header({ title = 'Strategic Objectives Dashboard', showPrint = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-[#0A1F3D] border-b border-white/10 px-6 py-3 flex items-center justify-between no-print relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "url('/assets/adinkra-bg-navy.png')", backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.08 }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <img
          src="/assets/clet-logo.png"
          alt="CLET"
          className="h-10 w-auto object-contain"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div>
          <h1 className="font-sans text-lg font-bold text-white leading-tight">{title}</h1>
          <p className="text-xs text-white/50 font-sans">Council for Legal Education and Training</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        {showPrint && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            <PrinterIcon size={14} />
            Print
          </button>
        )}
        <ThemeToggle />
        <div className="text-right ml-2">
          <p className="text-xs font-semibold text-white/90">{user?.name}</p>
          <p className="text-[10px] text-white/50 capitalize">{user?.role === 'dg' ? 'Director General' : 'Management'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-1"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
