import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, CornerDownRight, Send, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import { Header } from '../layout/Header'
import { ProgressRing } from './ProgressRing'
import useDataStore from '../../store/useDataStore'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { parseActivities, getAreaAbbrev } from '../../utils/helpers'

// ── Colours ───────────────────────────────────────────────────────────────────

const STATUS_META = [
  { key: 'completed',  label: 'Completed',   color: '#2E7D32' },
  { key: 'advanced',   label: 'Advanced',    color: '#1565C0' },
  { key: 'early',      label: 'Early',       color: '#B8943A' },
  { key: 'notStarted', label: 'Not Started', color: '#9E9E9E' },
  { key: 'atRisk',     label: 'At Risk',     color: '#C62828' },
]

// ── Utilities ─────────────────────────────────────────────────────────────────

function relTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.round(diff / 3600000)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.round(diff / 86400000)
  if (days < 30)  return `${days}d ago`
  return `${Math.round(diff / 2592000000)}mo ago`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────

function StatTile({ value, label, valueColor = 'text-[var(--text)]', accent }) {
  return (
    <div className={`rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 flex flex-col gap-1 ${accent ? `border-l-4` : ''}`}
      style={accent ? { borderLeftColor: accent } : {}}>
      <p className={`text-3xl font-bold font-sans leading-none ${valueColor}`}>{value}</p>
      <p className="text-[11px] font-medium text-[var(--text-muted)] font-sans uppercase tracking-wider mt-1">{label}</p>
    </div>
  )
}

// ── Status Donut ──────────────────────────────────────────────────────────────

function StatusDonut({ counts, total }) {
  const slices = STATUS_META.map(s => ({ ...s, value: counts[s.key] || 0 })).filter(s => s.value > 0)
  const display = slices.length ? slices : [{ label: 'None', color: '#E8EBF0', value: 1 }]

  return (
    <div className="relative inline-flex flex-shrink-0">
      <PieChart width={130} height={130}>
        <Pie
          data={display}
          cx={60}
          cy={60}
          innerRadius={38}
          outerRadius={60}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          paddingAngle={display.length > 1 ? 2 : 0}
          strokeWidth={0}
        >
          {display.map(d => <Cell key={d.label} fill={d.color} />)}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-[var(--text)] font-sans leading-none">{total}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-sans mt-0.5">tracked</span>
      </div>
    </div>
  )
}

// ── Area Progress Bar ─────────────────────────────────────────────────────────

function AreaBar({ area }) {
  const pct = area.progress
  const barColor = pct >= 80 ? '#2E7D32' : pct >= 50 ? '#B8943A' : pct > 0 ? '#1565C0' : '#DCE4F0'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--text)] font-sans truncate mr-3 flex-1">{area.name}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-[var(--text-muted)] font-sans">{area.taskCount} task{area.taskCount !== 1 ? 's' : ''}</span>
          <span className="text-xs font-bold text-[var(--text)] font-sans w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

// ── Area Mini-card ────────────────────────────────────────────────────────────

function AreaCard({ area }) {
  const abbrev = getAreaAbbrev(area.name)
  const pct = area.progress
  const barColor = pct >= 80 ? '#2E7D32' : pct >= 50 ? '#B8943A' : pct > 0 ? '#1565C0' : '#DCE4F0'

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold font-sans bg-[#0A1F3D] text-white px-2 py-0.5 rounded-md tracking-wide">
          {abbrev}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-sans">{area.taskCount} task{area.taskCount !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-sm font-semibold text-[var(--text)] font-sans leading-snug line-clamp-2 flex-1">{area.name}</p>
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex gap-3">
            <span className="text-[10px] text-[var(--text-muted)] font-sans">{area.completed} done</span>
            {area.inProgress > 0 && (
              <span className="text-[10px] text-[#B8943A] font-sans">{area.inProgress} active</span>
            )}
          </div>
          <span className="text-xs font-bold font-sans" style={{ color: barColor }}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-[var(--bg-soft)] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </div>
      </div>
    </div>
  )
}

// ── Stacked progress bar (overall breakdown) ──────────────────────────────────

function StatusStackedBar({ counts, total }) {
  if (total === 0) return null
  const segments = STATUS_META.map(s => ({ ...s, value: counts[s.key] || 0 })).filter(s => s.value > 0)
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      {segments.map(s => (
        <div
          key={s.key}
          className="h-full transition-all duration-700"
          style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  )
}

// ── Comment card with inline reply ───────────────────────────────────────────

function CommentCard({ comment, currentUser, onRefresh }) {
  const [replying, setReplying] = useState(false)
  const [text,     setText]     = useState('')
  const [posting,  setPosting]  = useState(false)

  const cancel = () => { setReplying(false); setText('') }

  const submit = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      await api.post(
        `/activity-tracking/${comment.task_id}/${encodeURIComponent(comment.activity_ref)}/comments`,
        { content: text.trim(), author_name: currentUser?.name || 'DG' },
      )
      cancel()
      onRefresh?.()
    } catch (err) {
      console.error('reply error:', err)
    } finally {
      setPosting(false)
    }
  }

  const authorInitials = (comment.author_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const userInitials   = (currentUser?.name || 'DG').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="py-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0A1F3D] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white font-sans">{authorInitials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text)] font-sans">{comment.author_name}</span>
            <span className="text-xs text-[var(--text-muted)] font-sans">{relTime(comment.created_at)}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">{fmtDate(comment.created_at)}</p>
          <p className="text-xs text-[#B8943A] font-sans mt-0.5 font-medium truncate">
            {comment.task_name}{comment.activity_ref ? ` · ${comment.activity_ref}` : ''}
          </p>
          <p className="text-sm text-[var(--text-soft)] font-sans mt-1.5 leading-relaxed">{comment.content}</p>

          {!replying && (
            <button
              onClick={() => setReplying(true)}
              className="mt-2 flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#B8943A] font-sans transition-colors"
            >
              <CornerDownRight size={11} />
              Reply
            </button>
          )}
        </div>
      </div>

      {replying && (
        <div className="mt-3 ml-11 flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#B8943A] flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-[9px] font-bold text-white font-sans">{userInitials}</span>
          </div>
          <div className="flex-1">
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
              placeholder="Write a reply… (Ctrl+Enter to post)"
              rows={2}
              className="w-full text-sm font-sans border border-[var(--line)] rounded-xl px-3 py-2 bg-[var(--bg-soft)] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[#B8943A] transition-colors"
            />
            <div className="flex justify-end gap-2 mt-1.5">
              <button onClick={cancel} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-sans px-2 py-1 transition-colors">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!text.trim() || posting}
                className="flex items-center gap-1.5 text-xs font-semibold font-sans bg-[#0A1F3D] text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-[#1a3a6e] transition-colors"
              >
                <Send size={11} />
                {posting ? 'Posting…' : 'Post Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingPulse({ className }) {
  return <div className={`skeleton rounded-xl animate-pulse ${className}`} />
}

// ── Main export ────────────────────────────────────────────────────────────────

export function DGSODetailPage() {
  const { soNumber } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const tasks        = useDataStore(s => s.tasks)

  const soTasks = useMemo(() => tasks.filter(t => t.so_number === soNumber), [tasks, soNumber])
  const soTitle = soTasks[0]?.so_title || `Strategic Objective ${soNumber.replace('SO', '')}`

  // ── Parse task data ──────────────────────────────────────────────────────
  const { totalActivities, totalSubActivities, thematicAreas, overallProgress } = useMemo(() => {
    let totalActivities    = 0
    let totalSubActivities = 0
    const areaMap = {}

    soTasks.forEach(t => {
      if (!areaMap[t.thematic_area]) areaMap[t.thematic_area] = []
      areaMap[t.thematic_area].push(t)

      const parsed = parseActivities(t.activities || '')
      totalActivities += parsed.length
      parsed.forEach(a => { totalSubActivities += a.subActivities.length })
    })

    const thematicAreas = Object.entries(areaMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, ts]) => ({
        name,
        taskCount:  ts.length,
        progress:   ts.length ? Math.round(ts.reduce((s, t) => s + (t.progress_pct || 0), 0) / ts.length) : 0,
        completed:  ts.filter(t => t.status === 'Completed').length,
        inProgress: ts.filter(t => ['Early', 'In Progress', 'Advanced'].includes(t.status)).length,
      }))

    const overallProgress = soTasks.length
      ? Math.round(soTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / soTasks.length)
      : 0

    return { totalActivities, totalSubActivities, thematicAreas, overallProgress }
  }, [soTasks])

  // ── Fetch activity-level tracking data ────────────────────────────────────
  const [trackingData, setTrackingData]   = useState([])
  const [loadingData,  setLoadingData]    = useState(true)

  const taskIds = useMemo(() => soTasks.map(t => t.id), [soTasks])

  const fetchTracking = useCallback(async () => {
    if (!taskIds.length) { setLoadingData(false); return }
    setLoadingData(true)
    const results = await Promise.all(taskIds.map(id => api.get(`/activity-tracking/${id}`).catch(() => [])))
    setTrackingData(results.flat())
    setLoadingData(false)
  }, [taskIds.join(',')])  // eslint-disable-line

  useEffect(() => { fetchTracking() }, [fetchTracking])

  // ── Aggregate counts ─────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    completed:  trackingData.filter(t => t.status === 'Completed').length,
    advanced:   trackingData.filter(t => t.status === 'Advanced').length,
    early:      trackingData.filter(t => t.status === 'Early').length,
    notStarted: trackingData.filter(t => t.status === 'Not Started').length,
    atRisk:     trackingData.filter(t => t.status === 'At Risk').length,
  }), [trackingData])

  const inProgress    = counts.early + counts.advanced
  const trackedTotal  = trackingData.length
  const remaining     = Math.max(0, totalActivities - counts.completed)

  // ── Aggregate comments ────────────────────────────────────────────────────
  const allComments = useMemo(() => {
    const out = []
    trackingData.forEach(tr => {
      const task = soTasks.find(t => t.id === tr.task_id)
      ;(tr.comments || []).forEach(c => out.push({
        ...c,
        task_id:      tr.task_id,
        activity_ref: tr.activity_ref,
        task_name:    task?.task || '',
      }))
    })
    return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [trackingData, soTasks])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header showPrint />

      <div className="max-w-7xl mx-auto px-6 pb-12 space-y-6 pt-4">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] font-sans transition-colors"
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>

        {/* ── Navy header ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0A1F3D] via-[#0d2a52] to-[#1e3560] p-6">
          <div className="flex items-center gap-6 flex-wrap">
            <ProgressRing value={overallProgress} size={88} strokeWidth={6} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 font-sans">{soNumber}</p>
              <h1 className="text-xl font-bold text-white font-sans mt-1 leading-snug">{soTitle}</h1>
              <p className="text-sm text-white/55 font-sans mt-1.5">
                {thematicAreas.length} thematic areas
                {' · '}
                {soTasks.length} tasks
                {' · '}
                {totalActivities} activities
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-5xl font-bold text-white font-sans leading-none">{overallProgress}%</p>
              <p className="text-xs text-white/40 font-sans mt-1 uppercase tracking-widest">progress</p>
            </div>
          </div>

          {/* Overall stacked progress strip */}
          {!loadingData && trackedTotal > 0 && (
            <div className="mt-5">
              <StatusStackedBar counts={counts} total={trackedTotal} />
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                {STATUS_META.map(s => counts[s.key] > 0 && (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] text-white/50 font-sans">{s.label}: <strong className="text-white/80">{counts[s.key]}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Metric tiles ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile value={thematicAreas.length} label="Thematic Areas" accent="#0A1F3D" />
          <StatTile value={totalActivities}       label="Activities"     accent="#1565C0" valueColor="text-[#1565C0]" />
          <StatTile value={totalSubActivities}    label="Sub-Activities" />
          <StatTile value={counts.completed}      label="Completed"      accent="#2E7D32" valueColor="text-[#2E7D32]" />
          <StatTile value={inProgress}            label="In Progress"    accent="#B8943A" valueColor="text-[#B8943A]" />
          <StatTile value={counts.atRisk > 0 ? counts.atRisk : remaining}
                    label={counts.atRisk > 0 ? 'At Risk' : 'Remaining'}
                    accent={counts.atRisk > 0 ? '#C62828' : '#9E9E9E'}
                    valueColor={counts.atRisk > 0 ? 'text-[#C62828]' : 'text-[var(--text-muted)]'} />
        </div>

        {/* ── Charts row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Status donut */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
            <div className="flex items-center gap-1.5 mb-4">
              <TrendingUp size={14} className="text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text)] font-sans">Activity Status</p>
            </div>
            {loadingData ? (
              <LoadingPulse className="h-32" />
            ) : (
              <div className="flex items-center gap-5">
                <StatusDonut counts={counts} total={trackedTotal} />
                <div className="flex-1 space-y-2">
                  {STATUS_META.map(s => {
                    const val = counts[s.key] || 0
                    if (!val && s.key !== 'notStarted') return null
                    return (
                      <div key={s.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-xs text-[var(--text-soft)] font-sans">{s.label}</span>
                        </div>
                        <span className="text-xs font-bold text-[var(--text)] font-sans">{val}</span>
                      </div>
                    )
                  })}
                  <div className="pt-1 border-t border-[var(--line)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)] font-sans">Remaining</span>
                    <span className="text-xs font-bold text-[var(--text)] font-sans">{remaining}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thematic area bars (spans 2) */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
            <p className="text-sm font-semibold text-[var(--text)] font-sans mb-4">Thematic Area Progress</p>
            <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              {thematicAreas.map(area => <AreaBar key={area.name} area={area} />)}
            </div>
          </div>
        </div>

        {/* ── Thematic area cards ──────────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-[var(--text)] font-sans mb-3">
            Thematic Areas
            <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{thematicAreas.length} areas</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {thematicAreas.map(area => <AreaCard key={area.name} area={area} />)}
          </div>
        </div>

        {/* ── Comments ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
            <MessageSquare size={14} className="text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text)] font-sans">Comments</p>
            <span className="ml-1 text-xs text-[var(--text-muted)] font-sans bg-[var(--bg-soft)] border border-[var(--line)] px-2 py-0.5 rounded-full">
              {allComments.length}
            </span>
          </div>

          {loadingData ? (
            <div className="p-5 space-y-4">
              {[1, 2].map(i => <LoadingPulse key={i} className="h-16" />)}
            </div>
          ) : allComments.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <MessageSquare size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-muted)] font-sans">No comments for this objective yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)] px-5">
              {allComments.map(c => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  currentUser={user}
                  onRefresh={fetchTracking}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
