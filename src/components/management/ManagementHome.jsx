import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Header } from '../layout/Header'
import { ProgressRing } from '../dashboard/ProgressRing'
import useDataStore from '../../store/useDataStore'
import { SO_SHORT_TITLES } from '../../utils/helpers'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

export function ManagementHome() {
  useRealtimeSync()
  const navigate   = useNavigate()
  const summaries  = useDataStore(s => s.getSOSummaries())
  const soVisibility = useDataStore(s => s.soVisibility)

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header title="CLET Management Portal" />

      <main className="flex-1 overflow-auto bg-white dark:bg-[var(--bg)]">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Page title */}
          <div className="mb-8 text-center">
            <h2 className="font-sans text-2xl font-bold text-[var(--text)] mb-1">
              Strategic Objectives
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-sans">
              Select a Strategic Objective to manage its tasks, activities, and dashboard visibility
            </p>
          </div>

          {/* 2×2 grid */}
          <div className="grid grid-cols-2 gap-6">
            {summaries.map((s, i) => {
              const visible = soVisibility[s.so_number]

              return (
                <motion.button
                  key={s.so_number}
                  onClick={() => navigate(`/management/so/${s.so_number}`)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
                  className="rounded-2xl border border-[var(--line)] overflow-hidden text-left bg-[var(--bg)] hover:border-[#B8943A] hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  {/* Navy header */}
                  <div className="px-5 py-4 bg-[#0A1F3D]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#B8943A] uppercase tracking-widest">{s.so_number}</span>
                        <p className="text-[10px] text-white/50 font-sans mt-0.5">{SO_SHORT_TITLES[s.so_number]}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold font-sans ${
                        visible ? 'bg-green-700/40 text-green-300' : 'bg-white/10 text-white/40'
                      }`}>
                        {visible ? <Eye size={10} /> : <EyeOff size={10} />}
                        {visible ? 'Published' : 'Hidden'}
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 flex items-start gap-4">
                    <ProgressRing value={s.overall_progress_pct} size={72} strokeWidth={6} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans font-semibold text-[var(--text)] text-sm leading-snug mb-3 line-clamp-3">
                        {s.so_title || SO_SHORT_TITLES[s.so_number]}
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {[
                          ['Completed',   s.completed,   'text-green-600 dark:text-green-400'],
                          ['In Progress', s.in_progress, 'text-[#B8943A]'],
                          ['Not Started', s.not_started, 'text-[var(--text-muted)]'],
                          ['At Risk',     s.at_risk,     'text-red-500 dark:text-red-400'],
                        ].map(([label, val, cls]) => (
                          <div key={label} className="flex items-baseline gap-1.5">
                            <span className={`text-sm font-bold font-sans ${cls}`}>{val}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-sans leading-none">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-2.5 border-t border-[var(--line-soft)] bg-[var(--bg-soft)] flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] font-sans">
                      {s.total_tasks} tasks · {s.overall_progress_pct}% complete
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#806014] font-sans group-hover:gap-2 transition-all">
                      Open <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
