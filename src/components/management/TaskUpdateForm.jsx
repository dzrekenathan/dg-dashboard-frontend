import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import useDataStore from '../../store/useDataStore'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../shared/Toast'

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'At Risk', 'Cancelled']

const STATUS_BG = {
  'Not Started': '#DCE4F0',
  'In Progress':  '#FFF9E6',
  'Completed':    '#E8F5E9',
  'On Hold':      '#FFF3E0',
  'At Risk':      '#FDECEA',
  'Cancelled':    '#F5F5F5',
}

export function TaskUpdateForm({ task }) {
  const updateTask = useDataStore(s => s.updateTask)
  const { user }   = useAuth()
  const toast      = useToast()

  const [fields, setFields] = useState({
    status:      task.status,
    progress_pct: task.progress_pct,
    assigned_to: task.assigned_to,
    target_date: task.target_date,
    notes:       task.notes,
  })
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving]     = useState(false)
  const timerRef = useRef(null)

  // Sync when task prop changes (e.g. after import)
  useEffect(() => {
    setFields({
      status:      task.status,
      progress_pct: task.progress_pct,
      assigned_to: task.assigned_to,
      target_date: task.target_date,
      notes:       task.notes,
    })
  }, [task.id])

  const save = useCallback((updated) => {
    setSaving(true)
    updateTask(task.id, { ...updated, updated_by: user?.name || 'Management' })
    setTimeout(() => {
      setSaving(false)
      toast('Changes saved', 'success', 1500)
    }, 300)
  }, [task.id, updateTask, user, toast])

  const handleChange = (key, value) => {
    const updated = { ...fields, [key]: value }
    setFields(updated)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(updated), 800)
  }

  return (
    <div className="bg-[var(--bg)] rounded-xl border border-[var(--line)] overflow-hidden">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs italic text-[#1F4480] dark:text-navy-light mb-0.5 font-sans">{task.thematic_area}</p>
        <h4 className="font-sans font-semibold text-[var(--text)] text-sm leading-snug">{task.task}</h4>
        {task.reference_numbers && (
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1">{task.reference_numbers}</p>
        )}
        {task.activities && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Activities {expanded ? '▲' : '▼'}
            </button>
            {expanded && (
              <p className="text-xs text-[var(--text-soft)] mt-1.5 bg-[var(--bg-soft)] rounded-lg p-2.5 whitespace-pre-line leading-relaxed border border-[var(--line-soft)]">
                {task.activities}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Editable fields */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-[var(--line-soft)] pt-3">
        {/* Status */}
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Status</label>
          <select
            value={fields.status}
            onChange={e => handleChange('status', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-navy transition"
            style={{ backgroundColor: STATUS_BG[fields.status] || undefined }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Progress slider */}
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Progress — <span className="text-[#806014] font-bold">{fields.progress_pct}%</span>
          </label>
          <input
            type="range" min="0" max="100" step="5"
            value={fields.progress_pct}
            onChange={e => handleChange('progress_pct', Number(e.target.value))}
            className="w-full h-2 rounded-full accent-[#806014]"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Assigned To</label>
          <input
            type="text"
            value={fields.assigned_to}
            onChange={e => handleChange('assigned_to', e.target.value)}
            placeholder="Name / Team"
            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-navy transition"
          />
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Target Date</label>
          <input
            type="date"
            value={fields.target_date}
            onChange={e => handleChange('target_date', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-navy transition"
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Notes / Comments</label>
          <textarea
            rows={3}
            value={fields.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Add notes or comments…"
            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-navy transition resize-none leading-relaxed"
          />
        </div>
      </div>

      {saving && (
        <div className="px-4 pb-2 text-[10px] text-green-600 dark:text-green-400 font-sans">Saving…</div>
      )}
    </div>
  )
}
