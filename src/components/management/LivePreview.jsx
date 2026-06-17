import { useState, useEffect } from 'react'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { KPISummaryBar } from '../dashboard/KPISummaryBar'
import { StatusPieChart } from '../dashboard/StatusPieChart'
import { StatusBadge } from '../shared/StatusBadge'
import { ProgressBar } from '../shared/ProgressBar'
import useDataStore from '../../store/useDataStore'
import { formatDateTime } from '../../utils/helpers'

export function LivePreview() {
  useRealtimeSync()
  const tasks    = useDataStore(s => s.tasks)
  const lastSync = useDataStore(s => s.lastSync)
  const summaries = useDataStore(s => s.getSOSummaries())
  const [secAgo, setSecAgo] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      if (lastSync) setSecAgo(Math.round((Date.now() - new Date(lastSync).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(iv)
  }, [lastSync])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Preview header */}
      <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--bg)] flex items-center justify-between">
        <div>
          <h2 className="font-serif font-semibold text-[var(--text)] text-sm">Live Dashboard Preview</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-sans">Updates as you save — visible to Director General</p>
        </div>
        {lastSync && (
          <span className="text-[10px] text-[var(--text-muted)] font-sans">
            Saved {secAgo < 60 ? `${secAgo}s` : `${Math.round(secAgo / 60)}m`} ago
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-[var(--bg)]">
        <div className="p-4 space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">No data loaded yet</div>
          ) : (
            <>
              <KPISummaryBar summaries={summaries} />

              {/* 2×2 grid of SO cards */}
              <div className="grid grid-cols-2 gap-3">
                {summaries.map(s => {
                  const soTasks = tasks.filter(t => t.so_number === s.so_number)
                  return (
                    <div key={s.so_number} className="rounded-xl border border-[var(--line)] overflow-hidden flex flex-col">
                      {/* SO header */}
                      <div className="px-3 py-2.5 bg-[#0A1F3D] flex items-center justify-between">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-[10px] font-bold text-[#B8943A] uppercase tracking-widest">{s.so_number}</span>
                          <h3 className="font-serif font-semibold text-white text-xs leading-snug line-clamp-2">{s.so_title}</h3>
                        </div>
                        <span className="text-sm font-bold text-[#B8943A] font-sans flex-shrink-0">{s.overall_progress_pct}%</span>
                      </div>

                      {/* Status counts row */}
                      <div className="grid grid-cols-4 border-b border-[var(--line-soft)] bg-[var(--bg-soft)]">
                        {[
                          [s.completed,   'Completed',   'text-green-600'],
                          [s.in_progress, 'In Progress', 'text-[#B8943A]'],
                          [s.not_started, 'Not Started', 'text-[var(--text-muted)]'],
                          [s.at_risk,     'At Risk',     'text-red-500'],
                        ].map(([v, label, cls]) => (
                          <div key={label} className="flex flex-col items-center py-1.5 border-r border-[var(--line-soft)] last:border-r-0">
                            <span className={`text-sm font-bold font-serif ${cls}`}>{v}</span>
                            <span className="text-[9px] text-[var(--text-muted)] font-sans leading-tight text-center px-0.5">{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tasks table + pie */}
                      <div className="flex flex-1">
                        <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-[10px] font-sans">
                            <thead>
                              <tr className="bg-[var(--burgundy-pale)] dark:bg-[var(--burgundy-soft)]">
                                {['Task', 'Status', '%'].map(h => (
                                  <th key={h} className="px-2 py-1 text-left font-semibold text-[#1F4480] dark:text-navy-pale whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {soTasks.slice(0, 4).map((t, i) => (
                                <tr key={t.id} className={i % 2 === 0 ? 'bg-[var(--bg)]' : 'bg-[var(--bg-soft)]'}>
                                  <td className="px-2 py-1 text-[var(--text)] max-w-[130px]">
                                    <div className="truncate">{t.task}</div>
                                  </td>
                                  <td className="px-2 py-1 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                                  <td className="px-2 py-1 min-w-[56px]"><ProgressBar value={t.progress_pct} /></td>
                                </tr>
                              ))}
                              {soTasks.length > 4 && (
                                <tr>
                                  <td colSpan={3} className="px-2 py-1 text-[9px] text-[var(--text-muted)] italic">
                                    +{soTasks.length - 4} more tasks…
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="w-24 border-l border-[var(--line)] p-1.5 flex-shrink-0">
                          <StatusPieChart summary={s} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-[10px] text-center text-[var(--text-muted)] font-sans pb-2">
                Last sync: {formatDateTime(lastSync)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
