import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp, Zap, UserPlus, MessageSquare, Send } from 'lucide-react'
import { Header } from '../layout/Header'
import { ProgressRing } from '../dashboard/ProgressRing'
import useDataStore from '../../store/useDataStore'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../shared/Toast'
import { getAreaAbbrev, parseActivities } from '../../utils/helpers'
import { api } from '../../api/client'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

const ACTIVITY_STATUSES = ['At Risk', 'Not Started', 'Early', 'Advanced', 'Completed']

const ACTIVITY_COLORS = {
  'At Risk':     { bg: '#FDECEA', border: '#C62828', text: '#C62828' },
  'Not Started': { bg: '#F5F5F5', border: '#9E9E9E', text: '#757575' },
  'Early':       { bg: '#FFF9E6', border: '#B8943A', text: '#806014' },
  'Advanced':    { bg: '#E8F0FE', border: '#1976D2', text: '#1565C0' },
  'Completed':   { bg: '#E8F5E9', border: '#2E7D32', text: '#1B5E20' },
}

function ActivityStatusBadge({ status }) {
  const c = ACTIVITY_COLORS[status] || ACTIVITY_COLORS['Not Started']
  return (
    <span
      className="text-[10px] font-semibold font-sans px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  )
}

function relTime(iso) {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60)      return 'just now'
  if (s < 3600)    return `${Math.floor(s / 60)}m ago`
  if (s < 86400)   return `${Math.floor(s / 3600)}h ago`
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`
  return `${Math.floor(s / 2592000)}mo ago`
}

// ── Activity card (status + comments per activity) ────────────────────────────
function ActivityCard({ activity, taskId, tracking, onTrackingChange }) {
  const [open, setOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingStatus, setSavingStatus] = useState(null)
  const assignRef = useRef(null)
  const { user } = useAuth()
  const toast = useToast()

  const status      = tracking?.status       || 'Not Started'
  const assigned    = tracking?.assigned_to  || ''
  const comments    = tracking?.comments     || []
  const targetDate  = tracking?.target_date  || ''

  const [localProgress, setLocalProgress] = useState(tracking?.progress_pct ?? 0)

  useEffect(() => {
    setLocalProgress(tracking?.progress_pct ?? 0)
  }, [tracking?.progress_pct])

  const patch = useCallback(async (body) => {
    setSaving(true)
    try {
      const ref = encodeURIComponent(activity.ref || activity.title.slice(0, 20))
      const updated = await api.patch(`/activity-tracking/${taskId}/${ref}`, body)
      onTrackingChange(activity.ref, updated)
    } catch {
      toast('Failed to save', 'error', 2500)
    } finally {
      setSaving(false)
      setSavingStatus(null)
    }
  }, [activity.ref, activity.title, taskId, onTrackingChange, toast])

  const handleStatusChange = (s) => {
    setSavingStatus(s)
    if (s === 'Completed') {
      setLocalProgress(100)
      patch({ status: s, progress_pct: 100 })
    } else {
      patch({ status: s })
    }
  }

  const handleProgressCommit = (val) => {
    const updates = { progress_pct: val }
    if (val === 100) updates.status = 'Completed'
    patch(updates)
  }

  const handleAssignBlur = () => {
    const val = assignRef.current?.value ?? ''
    if (val !== assigned) patch({ assigned_to: val })
  }

  const handleDateChange = (val) => patch({ target_date: val })

  const handlePostComment = async () => {
    const text = commentText.trim()
    if (!text) return
    try {
      const ref = encodeURIComponent(activity.ref || activity.title.slice(0, 20))
      const updated = await api.post(
        `/activity-tracking/${taskId}/${ref}/comments`,
        { content: text, author_name: user?.name || 'User' }
      )
      onTrackingChange(activity.ref, updated)
      setCommentText('')
    } catch {
      toast('Failed to post comment', 'error', 2500)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--line)] overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-soft)] hover:bg-[var(--bg)] transition-colors text-left"
      >
        <span className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-colors ${open ? 'bg-red-100 dark:bg-red-900/30' : 'bg-[#0A1F3D]/08 dark:bg-white/08'}`}>
          <Zap size={13} className={open ? 'text-red-500' : 'text-[#B8943A]'} />
        </span>
        <div className="flex-1 min-w-0">
          {activity.ref && (
            <p className="font-mono text-[9px] text-[var(--text-muted)] mb-0.5 tracking-wider">{activity.ref}</p>
          )}
          <p className="text-sm font-sans font-medium text-[var(--text)] leading-snug">{activity.title}</p>
          {!open && activity.subActivities.length > 0 && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-sans">
              {activity.subActivities.length} sub-activities | {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <ActivityStatusBadge status={status} />
          {open ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[var(--line-soft)] divide-y divide-[var(--line-soft)] bg-[var(--bg)]">

              {/* Description / sub-activities */}
              {activity.subActivities.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">Description</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans mb-2">Sub-activities:</p>
                  <ul className="space-y-1.5">
                    {activity.subActivities.map((sub, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--text)] font-sans leading-relaxed">
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status segmented control */}
              <div className="px-5 py-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 font-sans">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {ACTIVITY_STATUSES.map(s => {
                    const active = status === s
                    const isLoading = savingStatus === s
                    const c = ACTIVITY_COLORS[s]
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={saving}
                        className="flex-1 min-w-[80px] text-xs font-semibold font-sans py-2 px-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: active ? c.bg : 'transparent',
                          borderColor: active ? c.border : 'var(--line)',
                          color: active ? c.text : 'var(--text-muted)',
                          opacity: saving && !isLoading ? 0.45 : 1,
                        }}
                      >
                        {isLoading
                          ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Progress */}
              <div className="px-5 py-4">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                  Progress — <span className="text-[#806014]">{localProgress}%</span>
                </label>
                <input
                  type="range" min="0" max="100" step="5"
                  value={localProgress}
                  onChange={e => setLocalProgress(Number(e.target.value))}
                  onMouseUp={e => handleProgressCommit(Number(e.target.value))}
                  onTouchEnd={e => handleProgressCommit(Number(e.target.value))}
                  disabled={status === 'Completed'}
                  className="w-full h-2 rounded-full accent-[#806014] mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Target Date */}
              <div className="px-5 py-4">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                  Target Date
                </label>
                <input
                  type="date"
                  defaultValue={targetDate}
                  onBlur={e => { if (e.target.value !== targetDate) handleDateChange(e.target.value) }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#B8943A] transition font-sans"
                />
              </div>

              {/* Assignment */}
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2.5 font-sans">
                  <UserPlus size={10} /> Assignment
                </p>
                <input
                  ref={assignRef}
                  type="text"
                  defaultValue={assigned}
                  onBlur={handleAssignBlur}
                  placeholder="Assign to employee…"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#B8943A] transition font-sans"
                />
              </div>

              {/* Comments */}
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 font-sans">
                  <MessageSquare size={10} /> Comments ({comments.length})
                </p>

                {/* Existing comments */}
                {comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {comments.map(c => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0A1F3D] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold font-sans">
                            {c.author_name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--text)] font-sans">{c.author_name}</span>
                            <span className="text-[9px] text-[var(--text-muted)] font-sans">{relTime(c.created_at)}</span>
                          </div>
                          <p className="text-xs text-[var(--text-soft)] font-sans mt-0.5 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment input */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-red-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold font-sans">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostComment() }}
                      placeholder="Add a comment…"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#B8943A] transition resize-none font-sans leading-relaxed"
                    />
                    <AnimatePresence>
                      {commentText.trim() && (
                        <motion.button
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          onClick={handlePostComment}
                          className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-semibold rounded-lg transition-colors font-sans"
                        >
                          <Send size={10} /> Post Comment
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ── Main page ──────────────────────────────────────────────────────────────────
export function TaskDetailPage() {
  useRealtimeSync()
  const { soNumber, areaIndex, taskId } = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const tasks      = useDataStore(s => s.tasks)
  const updateTask = useDataStore(s => s.updateTask)
  const soTasks = useMemo(() => tasks.filter(t => t.so_number === soNumber), [tasks, soNumber])
  const task    = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId])

  const sortedAreas = useMemo(() =>
    [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
      .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0)),
    [soTasks]
  )

  const area      = sortedAreas[Number(areaIndex)]
  const areaLabel = area?.replace(/^\d+\.\s*/, '') ?? ''
  const abbrev    = area ? getAreaAbbrev(area) : ''

  const activities = useMemo(() => parseActivities(task?.activities), [task?.activities])

  // ── Activity tracking state ──────────────────────────────────────────────────
  const [trackingMap, setTrackingMap] = useState({})  // { activity_ref: ActivityTrackingOut }

  // Stable refs so handleTrackingChange can read latest values without stale closure
  const activitiesRef = useRef([])
  const trackingMapRef = useRef({})
  useEffect(() => { activitiesRef.current = activities }, [activities])
  useEffect(() => { trackingMapRef.current = trackingMap }, [trackingMap])

  useEffect(() => {
    if (!taskId) return
    api.get(`/activity-tracking/${taskId}`)
      .then(data => {
        const map = {}
        data.forEach(t => { map[t.activity_ref] = t })
        setTrackingMap(map)
      })
      .catch(() => {})
  }, [taskId])

  const handleTrackingChange = useCallback((ref, updated) => {
    setTrackingMap(prev => ({ ...prev, [ref]: updated }))

    // Derive task-level status + progress from the new aggregate and push to store
    const next = { ...trackingMapRef.current, [ref]: updated }
    const acts = activitiesRef.current
    if (acts.length === 0) return

    const sum = acts.reduce((acc, act) => acc + (next[act.ref]?.progress_pct ?? 0), 0)
    const progress = Math.round(sum / acts.length)
    const statuses = acts.map(act => next[act.ref]?.status || 'Not Started')

    let taskStatus = 'Not Started'
    if (statuses.every(s => s === 'Completed'))                                        taskStatus = 'Completed'
    else if (statuses.some(s => s === 'At Risk'))                                      taskStatus = 'At Risk'
    else if (statuses.some(s => ['In Progress', 'Advanced', 'Early', 'Completed'].includes(s))) taskStatus = 'In Progress'

    updateTask(taskId, { progress_pct: progress, status: taskStatus })
  }, [taskId, updateTask])

  // Average progress across all parsed activities (0 for untracked ones)
  const overallProgress = useMemo(() => {
    if (activities.length === 0) return task?.progress_pct || 0
    const sum = activities.reduce((acc, act) => acc + (trackingMap[act.ref]?.progress_pct ?? 0), 0)
    return Math.round(sum / activities.length)
  }, [activities, trackingMap, task?.progress_pct])

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <Header title="CLET Management Portal" />
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] font-sans">
          Task not found.{' '}
          <button onClick={() => navigate(`/management/so/${soNumber}/area/${areaIndex}`)} className="ml-2 text-[#B8943A] underline">
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
            <nav className="flex items-center gap-1.5 text-[10px] text-white/40 font-sans mb-4 flex-wrap">
              <button onClick={() => navigate('/management')} className="hover:text-white/70 transition-colors">All SOs</button>
              <span>›</span>
              <button onClick={() => navigate(`/management/so/${soNumber}`)} className="hover:text-white/70 transition-colors">{soNumber}</button>
              <span>›</span>
              <button onClick={() => navigate(`/management/so/${soNumber}/area/${areaIndex}`)} className="hover:text-white/70 transition-colors">
                {abbrev} — {areaLabel}
              </button>
              <span>›</span>
              <span className="text-white/70 truncate max-w-[180px]">{task.task}</span>
            </nav>

            <div className="flex items-start gap-4">
              <ProgressRing value={overallProgress} size={64} strokeWidth={6} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-sm font-bold text-[#B8943A] uppercase tracking-widest">Task</span>
                    <h2 className="font-sans font-bold text-white text-xl leading-snug mt-1">{task.task}</h2>
                    <p className="text-xs text-white/50 font-sans mt-1">{abbrev} — {areaLabel}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {task.timeframe && <span className="text-xs text-white/60 font-sans">{task.timeframe}</span>}
                  {task.responsibility && <span className="text-xs text-white/60 font-sans">{task.responsibility}</span>}
                  {task.budget && <span className="text-xs text-white/60 font-sans">{task.budget}</span>}
                  {activities.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-white/60 font-sans">
                      <Zap size={11} className="text-[#B8943A]" /> {activities.length} Activities
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata: outputs / outcomes / risks */}
          {(task.outputs || task.outcomes || task.risks_mitigation) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                ['Outputs / Deliverables', task.outputs],
                ['Outcomes / Impact',      task.outcomes],
                ['Risks & Mitigation',     task.risks_mitigation],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">{label}</p>
                  <p className="text-xs text-[var(--text-soft)] font-sans leading-relaxed whitespace-pre-line">{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Activity cards */}
          {activities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-1 font-sans">
                Activities &amp; Sub-Activities
              </h3>
              <div className="space-y-2">
                {activities.map((act, idx) => (
                  <ActivityCard
                    key={`${act.ref || idx}`}
                    activity={act}
                    taskId={taskId}
                    tracking={trackingMap[act.ref] || null}
                    onTrackingChange={handleTrackingChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fallback: raw text if activities aren't structured */}
          {task.activities && activities.length === 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-1 font-sans">
                Activities &amp; Sub-Activities
              </h3>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-xs text-[var(--text-soft)] whitespace-pre-line leading-relaxed font-sans">
                {task.activities}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/management/so/${soNumber}/area/${areaIndex}`)}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-sans transition-colors pb-4"
          >
            <ArrowLeft size={13} /> Back to {abbrev} — {areaLabel}
          </button>
        </div>
      </main>
    </div>
  )
}
