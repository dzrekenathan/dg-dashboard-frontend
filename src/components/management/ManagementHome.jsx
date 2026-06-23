import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Header } from '../layout/Header'
import { ProgressRing } from '../dashboard/ProgressRing'
import { useAuth } from '../../context/AuthContext'
import useDataStore from '../../store/useDataStore'
import { SO_SHORT_TITLES, DIRECTORATE_NAMES, getAreaAbbrev } from '../../utils/helpers'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

function DirectorateHero({ code, name, totalAreas, totalTasks, progressPct }) {
  return (
    <div className="mb-8 rounded-2xl bg-[#0A1F3D] px-6 py-5 flex items-center gap-6">
      <ProgressRing value={progressPct} size={68} strokeWidth={6} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#B8943A] uppercase tracking-widest font-sans">{code}</span>
        </div>
        <h2 className="font-sans font-bold text-white text-lg leading-snug">{name}</h2>
        <p className="text-xs text-white/50 font-sans mt-0.5">
          {totalAreas} thematic {totalAreas === 1 ? 'area' : 'areas'} · {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
        </p>
      </div>
    </div>
  )
}

function DirectorateAreaCard({ area, animDelay, onClick }) {
  const areaLabel = area.area
    .replace(/^\d+\.\s*/, '')
    .replace(/\([^)]+\)\s*$/, '')
    .trim()
  const abbrev = getAreaAbbrev(area.area)

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, type: 'spring', stiffness: 200, damping: 22 }}
      className="rounded-2xl border border-[var(--line)] overflow-hidden text-left bg-[var(--bg)] hover:border-[#B8943A] hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      <div className="px-4 py-3 bg-[#0A1F3D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[#B8943A] tracking-widest">{abbrev}</span>
          {area.at_risk > 0 && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-300 font-sans">
              <AlertTriangle size={8} /> {area.at_risk} at risk
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-sans">
          <CheckCircle2 size={8} className="text-green-400" />
          {area.completed}/{area.total}
        </span>
      </div>

      <div className="p-4 flex items-start gap-3">
        <ProgressRing value={area.progress_pct} size={52} strokeWidth={5} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-[var(--text)] text-sm leading-snug line-clamp-2 mb-2">
            {areaLabel}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              ['Completed',   area.completed,   'text-green-600 dark:text-green-400'],
              ['In Progress', area.in_progress, 'text-[#B8943A]'],
            ].map(([label, val, cls]) => (
              <span key={label} className="flex items-baseline gap-1">
                <span className={`text-xs font-bold font-sans ${cls}`}>{val}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-sans">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[var(--line-soft)] bg-[var(--bg-soft)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)] font-sans">
          {area.total} {area.total === 1 ? 'task' : 'tasks'}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#806014] font-sans group-hover:gap-2 transition-all">
          Open <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  )
}

function SOSection({ soNumber, soTitle, areas, onAreaClick }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-[#B8943A] uppercase tracking-widest font-sans">{soNumber}</span>
        <span className="text-sm font-semibold text-[var(--text)] font-sans">{soTitle}</span>
        <div className="flex-1 h-px bg-[var(--line)]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {areas.map((area, i) => (
          <DirectorateAreaCard
            key={area.area}
            area={area}
            animDelay={i * 0.08}
            onClick={() => onAreaClick(soNumber, area.idx)}
          />
        ))}
      </div>
    </div>
  )
}

function AllSOsView({ summaries, soVisibility, navigate }) {
  return (
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
  )
}

export function ManagementHome() {
  useRealtimeSync()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const directorate  = user?.directorate ?? null
  const dirName      = DIRECTORATE_NAMES[directorate] || directorate || ''

  const summaries    = useDataStore(s => s.getSOSummaries())
  const soVisibility = useDataStore(s => s.soVisibility)
  const dirGroups    = useDataStore(s => directorate ? s.getDirectorateAreas(directorate) : [])

  const heroStats = useMemo(() => {
    if (!directorate || dirGroups.length === 0) return { totalAreas: 0, totalTasks: 0, overallPct: 0 }
    const allAreas  = dirGroups.flatMap(g => g.areas)
    const totalTasks = allAreas.reduce((s, a) => s + a.total, 0)
    const overallPct = totalTasks
      ? Math.round(allAreas.reduce((s, a) => s + a.progress_pct * a.total, 0) / totalTasks)
      : 0
    return { totalAreas: allAreas.length, totalTasks, overallPct }
  }, [directorate, dirGroups])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header title="CLET Management Portal" />
      <main className="flex-1 overflow-auto bg-white dark:bg-[var(--bg)]">
        <div className="p-8 max-w-4xl mx-auto">

          {directorate ? (
            <>
              <DirectorateHero
                code={directorate}
                name={dirName}
                totalAreas={heroStats.totalAreas}
                totalTasks={heroStats.totalTasks}
                progressPct={heroStats.overallPct}
              />

              {dirGroups.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">📂</p>
                  <p className="text-base font-semibold text-[var(--text)] font-sans">
                    No thematic areas found for your directorate
                  </p>
                  <p className="text-sm text-[var(--text-muted)] font-sans mt-1">
                    Data may not be imported yet.
                  </p>
                </div>
              ) : (
                dirGroups.map(group => (
                  <SOSection
                    key={group.so_number}
                    soNumber={group.so_number}
                    soTitle={group.so_title}
                    areas={group.areas}
                    onAreaClick={(soNum, idx) => navigate(`/management/so/${soNum}/area/${idx}`)}
                  />
                ))
              )}
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="font-sans text-2xl font-bold text-[var(--text)] mb-1">
                  Strategic Objectives
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-sans">
                  Select a Strategic Objective to manage its tasks, activities, and dashboard visibility
                </p>
              </div>
              <AllSOsView summaries={summaries} soVisibility={soVisibility} navigate={navigate} />
            </>
          )}

        </div>
      </main>
    </div>
  )
}
