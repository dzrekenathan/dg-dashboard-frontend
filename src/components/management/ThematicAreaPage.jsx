import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react'
import { Header } from '../layout/Header'
import { StatusBadge } from '../shared/StatusBadge'
import useDataStore from '../../store/useDataStore'
import { SO_SHORT_TITLES, getAreaAbbrev, parseActivities } from '../../utils/helpers'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

const STATUS_DOT = {
  'Not Started': 'bg-slate-400',
  'In Progress': 'bg-[#B8943A]',
  'Completed':   'bg-green-600',
  'On Hold':     'bg-orange-500',
  'At Risk':     'bg-red-600',
  'Cancelled':   'bg-gray-400',
}

function TaskCard({ task, idx, onClick }) {
  const activityCount = useMemo(() => parseActivities(task.activities).length, [task.activities])
  const progress = task.progress_pct || 0

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, type: 'spring', stiffness: 220, damping: 24 }}
      className="w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] hover:border-[#B8943A] hover:shadow-lg transition-all duration-300 group cursor-pointer text-left overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[task.status] || STATUS_DOT['Not Started']}`} />
          <div className="flex-1 min-w-0">
            {task.reference_numbers && (
              <p className="font-mono text-[10px] text-[var(--text-muted)] mb-0.5 tracking-wider">
                {task.reference_numbers.replace(/\n/g, ' · ')}
              </p>
            )}
            <h4 className="font-serif font-semibold text-[var(--text)] text-sm leading-snug">{task.task}</h4>
            {(task.timeframe || task.responsibility) && (
              <p className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5">
                {task.timeframe && <span>📅 {task.timeframe}</span>}
                {task.timeframe && task.responsibility && <span className="mx-1.5 opacity-40">·</span>}
                {task.responsibility && <span>{task.responsibility}</span>}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            <StatusBadge status={task.status} />
            <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-[#B8943A] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Activity count + progress */}
        <div className="mt-3 ml-5 flex items-center gap-3">
          {activityCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-sans">
              <Zap size={10} className="text-[#B8943A]" />
              {activityCount} {activityCount === 1 ? 'Activity' : 'Activities'}
            </span>
          )}
          {progress > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] font-sans">{progress}% complete</span>
          )}
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mt-2 ml-5 h-1 rounded-full bg-[var(--line-soft)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B8943A] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.button>
  )
}

export function ThematicAreaPage() {
  useRealtimeSync()
  const { soNumber, areaIndex } = useParams()
  const navigate = useNavigate()

  const tasks = useDataStore(s => s.tasks)
  const soTasks = useMemo(() => tasks.filter(t => t.so_number === soNumber), [tasks, soNumber])
  const soTitle = soTasks[0]?.so_title || SO_SHORT_TITLES[soNumber] || soNumber

  const sortedAreas = useMemo(() =>
    [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
      .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0)),
    [soTasks]
  )

  const area = sortedAreas[Number(areaIndex)]
  const areaLabel = area?.replace(/^\d+\.\s*/, '') ?? ''
  const abbrev = area ? getAreaAbbrev(area) : ''

  const areaTasks = useMemo(
    () => soTasks.filter(t => t.thematic_area === area),
    [soTasks, area]
  )

  const completed   = areaTasks.filter(t => t.status === 'Completed').length
  const progress_pct = areaTasks.length
    ? Math.round(areaTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / areaTasks.length)
    : 0

  if (!area) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <Header title="CLET Management Portal" />
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] font-sans">
          Area not found.{' '}
          <button onClick={() => navigate(`/management/so/${soNumber}`)} className="ml-2 text-[#B8943A] underline">
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header title="CLET Management Portal" />

      <main className="flex-1 overflow-auto bg-[var(--bg)]">
        <div className="p-6 max-w-4xl mx-auto space-y-5">

          {/* Header card */}
          <div className="bg-[#0A1F3D] rounded-2xl p-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[10px] text-white/40 font-sans mb-4 flex-wrap">
              <button onClick={() => navigate('/management')} className="hover:text-white/70 transition-colors">All SOs</button>
              <span>›</span>
              <button onClick={() => navigate(`/management/so/${soNumber}`)} className="hover:text-white/70 transition-colors">{soNumber}</button>
              <span>›</span>
              <span className="text-white/70">{abbrev} — {areaLabel}</span>
            </nav>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#B8943A] tracking-widest">{abbrev}</span>
                <h2 className="font-serif font-bold text-white text-base leading-snug mt-0.5 max-w-xl">{areaLabel}</h2>
                <p className="text-xs text-white/50 font-sans mt-1">
                  {areaTasks.length} {areaTasks.length === 1 ? 'task' : 'tasks'} · {completed} completed · {progress_pct}% overall progress
                </p>
              </div>
              <button
                onClick={() => navigate(`/management/so/${soNumber}`)}
                className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-sans transition-colors"
              >
                <ArrowLeft size={14} /> Back to {soNumber}
              </button>
            </div>

            {/* Overall progress bar */}
            {progress_pct > 0 && (
              <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#B8943A] transition-all duration-700"
                  style={{ width: `${progress_pct}%` }}
                />
              </div>
            )}
          </div>

          {/* Task list */}
          <div className="space-y-3">
            {areaTasks.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                idx={idx}
                onClick={() => navigate(`/management/so/${soNumber}/area/${areaIndex}/task/${task.id}`)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
