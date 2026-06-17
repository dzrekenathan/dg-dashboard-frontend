import { useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Download, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Header } from '../layout/Header'
import { ProgressRing } from '../dashboard/ProgressRing'
import useDataStore from '../../store/useDataStore'
import { SO_SHORT_TITLES, getAreaAbbrev } from '../../utils/helpers'
import { api } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

// ── Thematic area card ────────────────────────────────────────────────────────
function AreaCard({ group, idx, soNumber, onClick }) {
  const { area, abbrev, total, completed, in_progress, at_risk, progress_pct } = group
  const areaLabel = area.replace(/^\d+\.\s*/, '')

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 220, damping: 24 }}
      className="rounded-2xl border border-[var(--line)] overflow-hidden text-left bg-[var(--bg)] hover:border-[#B8943A] hover:shadow-xl transition-all duration-300 group cursor-pointer w-full"
    >
      {/* Navy header strip */}
      <div className="px-4 py-3 bg-[#0A1F3D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[#B8943A] tracking-widest">{abbrev}</span>
          {at_risk > 0 && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-300 font-sans">
              <AlertTriangle size={8} /> {at_risk} at risk
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-sans">
          <CheckCircle2 size={8} className="text-green-400" />
          {completed}/{total}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4 flex items-start gap-3">
        <ProgressRing value={progress_pct} size={52} strokeWidth={5} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-[var(--text)] text-sm leading-snug line-clamp-2 mb-2">
            {areaLabel}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              ['Completed',   completed,   'text-green-600 dark:text-green-400'],
              ['In Progress', in_progress, 'text-[#B8943A]'],
            ].map(([label, val, cls]) => (
              <span key={label} className="flex items-baseline gap-1">
                <span className={`text-xs font-bold font-serif ${cls}`}>{val}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-sans">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--line-soft)] bg-[var(--bg-soft)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)] font-sans">{total} {total === 1 ? 'task' : 'tasks'}</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#806014] font-sans group-hover:gap-2 transition-all">
          Open <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function SODetailPage() {
  useRealtimeSync()
  const { soNumber }       = useParams()
  const navigate           = useNavigate()
  const toast              = useToast()
  const fileRef            = useRef()

  const tasks              = useDataStore(s => s.tasks)
  const fetchTasks         = useDataStore(s => s.fetchTasks)
  const soVisibility       = useDataStore(s => s.soVisibility)
  const toggleSOVisibility = useDataStore(s => s.toggleSOVisibility)

  const soTasks  = useMemo(() => tasks.filter(t => t.so_number === soNumber), [tasks, soNumber])
  const soTitle  = soTasks[0]?.so_title || SO_SHORT_TITLES[soNumber] || soNumber
  const isVisible = soVisibility[soNumber]

  const thematicGroups = useMemo(() => {
    const areas = [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
      .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
    return areas.map((area, idx) => {
      const areaTasks = soTasks.filter(t => t.thematic_area === area)
      return {
        area,
        idx,
        abbrev: getAreaAbbrev(area),
        tasks: areaTasks,
        total: areaTasks.length,
        completed:   areaTasks.filter(t => t.status === 'Completed').length,
        in_progress: areaTasks.filter(t => t.status === 'In Progress').length,
        not_started: areaTasks.filter(t => t.status === 'Not Started').length,
        at_risk:     areaTasks.filter(t => t.status === 'At Risk').length,
        progress_pct: areaTasks.length
          ? Math.round(areaTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / areaTasks.length)
          : 0,
      }
    })
  }, [soTasks])

  const summary = useMemo(() => {
    const total = soTasks.length
    return {
      total,
      completed:   soTasks.filter(t => t.status === 'Completed').length,
      in_progress: soTasks.filter(t => t.status === 'In Progress').length,
      not_started: soTasks.filter(t => t.status === 'Not Started').length,
      at_risk:     soTasks.filter(t => t.status === 'At Risk').length,
      progress_pct: total
        ? Math.round(soTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / total)
        : 0,
    }
  }, [soTasks])

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const form = new FormData()
      form.append('file', file)
      const result = await api.upload(`/tasks/import?so_number=${soNumber}`, form)
      toast(`Imported ${result.imported} tasks for ${soNumber}`, 'info', 3000)
      await fetchTasks()
    } catch (err) {
      toast(err.message || 'Import failed', 'error', 5000)
    }
    e.target.value = ''
  }

  const handleExport = () => {
    api.download(`/tasks/export?so_number=${soNumber}`, `CLET_${soNumber}_Matrix.xlsx`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header title="CLET Management Portal" />

      <main className="flex-1 overflow-auto bg-[var(--bg)]">
        <div className="p-6 max-w-5xl mx-auto space-y-5">

          {/* Page header card */}
          <div className="bg-[#0A1F3D] rounded-2xl p-5">
            <button
              onClick={() => navigate('/management')}
              className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-sans mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> All Strategic Objectives
            </button>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <ProgressRing value={summary.progress_pct} size={68} strokeWidth={6} />
                <div>
                  <span className="text-xs font-bold text-[#B8943A] uppercase tracking-widest">{soNumber}</span>
                  <h2 className="font-serif font-bold text-white text-base leading-snug max-w-xl">{soTitle}</h2>
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {[
                      ['Completed',   summary.completed,   'text-green-400'],
                      ['In Progress', summary.in_progress, 'text-[#B8943A]'],
                      ['Not Started', summary.not_started, 'text-white/50'],
                      ['At Risk',     summary.at_risk,     'text-red-400'],
                    ].map(([l, v, c]) => (
                      <span key={l} className={`text-xs font-sans ${c}`}>
                        <strong>{v}</strong> {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  <Upload size={13} /> Import Excel
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#806014] hover:bg-[#B8943A] text-white text-xs font-semibold transition-colors"
                >
                  <Download size={13} /> Export
                </button>
                <button
                  onClick={() => {
                    toggleSOVisibility(soNumber)
                    toast(
                      isVisible
                        ? `${soNumber} hidden from the Director General dashboard`
                        : `${soNumber} published to the Director General dashboard`,
                      isVisible ? 'info' : 'success',
                      3000,
                    )
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isVisible
                      ? 'bg-green-700 hover:bg-red-700 text-white'
                      : 'bg-white/10 hover:bg-green-700 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  {isVisible ? 'Published — click to hide' : 'Hidden — click to publish'}
                </button>
              </div>
            </div>
          </div>

          {/* Thematic area grid */}
          {soTasks.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)] font-sans">
              <p className="text-5xl mb-4">📂</p>
              <p className="text-base font-semibold text-[var(--text)]">No tasks loaded for {soNumber}</p>
              <p className="text-sm mt-1">Import an Excel file using the button above to get started.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--text-muted)] font-sans px-1">
                {thematicGroups.length} Thematic {thematicGroups.length === 1 ? 'Area' : 'Areas'} · {soTasks.length} Tasks total
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {thematicGroups.map((group) => (
                  <AreaCard
                    key={group.area}
                    group={group}
                    idx={group.idx}
                    soNumber={soNumber}
                    onClick={() => navigate(`/management/so/${soNumber}/area/${group.idx}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
