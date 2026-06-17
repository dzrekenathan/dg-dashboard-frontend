import { ProgressRing } from './ProgressRing'
import { SO_ADINKRA, SO_DEPT_LOGOS } from '../../utils/helpers'

const SO_BG = {
  SO1: 'bg-navy-soft dark:bg-[#131F33]',
  SO2: 'bg-[#EEF0FA] dark:bg-[#141628]',
  SO3: 'bg-[#EEF7EE] dark:bg-[#131E13]',
  SO4: 'bg-[#FDF7EE] dark:bg-[#1E1A10]',
}

export function SOProgressCard({ summary }) {
  const adinkra = SO_ADINKRA[summary.so_number]
  const deptLogos = SO_DEPT_LOGOS[summary.so_number] || []

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[var(--line)] p-5 ${SO_BG[summary.so_number]}`}>
      {/* Adinkra watermark */}
      {adinkra && (
        <img
          src={adinkra.symbol}
          alt=""
          aria-hidden="true"
          className="absolute -right-4 -bottom-4 w-32 h-32 select-none pointer-events-none"
          style={{ opacity: 0.07 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {summary.so_number}
            </span>
            <h3 className="font-serif font-semibold text-[var(--text)] text-base leading-tight mt-0.5">
              {summary.so_title || `Strategic Objective ${summary.so_number.slice(2)}`}
            </h3>
          </div>
          <ProgressRing value={summary.overall_progress_pct} size={72} label={summary.so_number} />
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs font-sans">
          <Stat label="Completed"   value={summary.completed}   color="text-green-700 dark:text-green-400" />
          <Stat label="In Progress" value={summary.in_progress} color="text-[#806014] dark:text-[#B8943A]" />
          <Stat label="Not Started" value={summary.not_started} color="text-[var(--text-soft)]" />
          <Stat label="At Risk"     value={summary.at_risk}     color="text-red-700 dark:text-red-400" />
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-2">
          {summary.completed} / {summary.total_tasks} tasks completed
        </p>

        {deptLogos.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--line-soft)]">
            {deptLogos.map((src, i) => (
              <img key={i} src={src} alt="" className="h-5 w-auto object-contain opacity-60"
                onError={e => { e.currentTarget.style.display = 'none' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-[var(--text-muted)]">{label}</span>
    </div>
  )
}
