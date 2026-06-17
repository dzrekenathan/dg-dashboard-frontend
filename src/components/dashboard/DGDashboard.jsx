import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, BarChart2, PieChart as PieIcon, MessageSquare, CornerDownRight, Send } from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import { Header } from '../layout/Header'
import useDataStore from '../../store/useDataStore'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

// ── Constants ─────────────────────────────────────────────────────────────────

const SO_STATUS_COLORS = {
  Completed:   '#2E7D32',
  Advanced:    '#1565C0',
  Early:       '#B8943A',
  'At Risk':   '#C62828',
  'Not Started': '#9E9E9E',
}

function getSoStatus(summary) {
  if (summary.overall_progress_pct >= 100) return 'Completed'
  if (summary.at_risk > 0)                 return 'At Risk'
  if (summary.overall_progress_pct >= 60)  return 'Advanced'
  if (summary.overall_progress_pct > 0)    return 'Early'
  return 'Not Started'
}

function relTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.round(diff / 3600000)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.round(diff / 86400000)
  if (days < 30)  return `${days}d ago`
  const months = Math.round(diff / 2592000000)
  return `${months} month${months !== 1 ? 's' : ''} ago`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Stats Banner ──────────────────────────────────────────────────────────────

function StatsBanner({ overallProgress, sosCompleted, totalComments }) {
  const stats = [
    { label: 'WORKPLAN PROGRESS', value: `${overallProgress}%` },
    { label: "SO'S COMPLETED",    value: sosCompleted },
    { label: 'COMMENTS LOGGED',   value: totalComments },
  ]

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#0A1F3D] via-[#0d2a52] to-[#1e3560] p-6">
      <div className="flex items-center gap-8 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg font-sans leading-snug">Master workplan tracker</p>
          <p className="text-white/55 text-sm font-sans mt-1">Follow strategic objective execution.</p>
        </div>
        <div className="flex gap-px overflow-hidden rounded-xl border border-white/10">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-6 py-3 ${i === 0 ? '' : 'border-l border-white/10'} bg-white/5`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45 font-sans">{s.label}</p>
              <p className="font-bold text-white text-2xl mt-1 font-sans">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Workplan Hierarchy Card ───────────────────────────────────────────────────

function HierarchyCard({ soCount, areaCount, taskCount }) {
  const rows = [
    { label: 'STRATEGIC OBJECTIVES', value: soCount,   color: '#0A1F3D' },
    { label: 'THEMATIC AREAS',        value: areaCount, color: '#B8943A' },
    { label: 'TASKS',                 value: taskCount, color: '#1565C0' },
  ]

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[var(--text)] font-sans">Workplan Hierarchy at a glance</p>
        <Flag size={15} className="text-[var(--text-muted)]" />
      </div>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] font-sans">{r.label}</p>
              <p className="text-2xl font-bold text-[var(--text)] font-sans leading-tight">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SO Tracker Bar Chart ──────────────────────────────────────────────────────

function SOTrackerCard({ summaries, selectedSO, onSelect }) {
  const BAR_H = 110

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-semibold text-[var(--text)] font-sans">SO tracker</p>
        <BarChart2 size={15} className="text-red-500" />
      </div>
      <div className="flex items-end justify-around gap-2" style={{ height: BAR_H + 40 }}>
        {summaries.map(s => {
          const isSelected = selectedSO === s.so_number
          return (
            <button
              key={s.so_number}
              onClick={() => onSelect(s.so_number)}
              className="flex flex-col items-center gap-0 flex-1 group focus:outline-none"
            >
              <span className={`text-xs font-bold font-sans mb-1.5 transition-colors ${
                isSelected ? 'text-[#B8943A]' : 'text-[var(--text)]'
              }`}>
                {s.overall_progress_pct}%
              </span>
              <div
                className={`w-full relative rounded transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-[#B8943A] ring-offset-1' : ''
                }`}
                style={{
                  height: BAR_H,
                  backgroundColor: isSelected ? '#EDD89A33' : 'var(--bg-soft)',
                }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded transition-all duration-700"
                  style={{
                    height: `${s.overall_progress_pct}%`,
                    backgroundColor: isSelected ? '#B8943A' : '#C9A85A',
                  }}
                />
              </div>
              <span className={`text-[10px] font-bold font-sans mt-1.5 transition-colors ${
                isSelected ? 'text-[#B8943A]' : 'text-[var(--text)]'
              }`}>
                SO {s.so_number.replace('SO', '')}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] font-sans text-center leading-tight mt-0.5">
                Strategic Objective {s.so_number.replace('SO', '')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── SO Status Donut ───────────────────────────────────────────────────────────

const TASK_STATUS_COLORS = {
  Completed:     '#2E7D32',
  Advanced:      '#1565C0',
  Early:         '#B8943A',
  'Not Started': '#9E9E9E',
  'At Risk':     '#C62828',
}

function SOStatusCard({ summaries, focusedSO }) {
  const { data, total, centerLabel, subtitle } = useMemo(() => {
    if (focusedSO) {
      const taskData = [
        { name: 'Completed',   value: focusedSO.completed },
        { name: 'Advanced',    value: focusedSO.advanced },
        { name: 'Early',       value: focusedSO.early },
        { name: 'Not Started', value: focusedSO.not_started },
        { name: 'At Risk',     value: focusedSO.at_risk },
      ].filter(d => d.value > 0)
      return {
        data:        taskData,
        total:       focusedSO.total_tasks,
        centerLabel: 'tasks',
        subtitle:    `${focusedSO.so_number}: task breakdown`,
      }
    }
    const counts = {}
    summaries.forEach(s => {
      const st = getSoStatus(s)
      counts[st] = (counts[st] || 0) + 1
    })
    return {
      data:        Object.entries(counts).map(([name, value]) => ({ name, value })),
      total:       summaries.length,
      centerLabel: 'SOs',
      subtitle:    'Strategic objective completion state.',
    }
  }, [focusedSO, summaries])

  const colorMap = focusedSO ? TASK_STATUS_COLORS : SO_STATUS_COLORS
  const displayData = data.length ? data : [{ name: 'empty', value: 1 }]

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-[var(--text)] font-sans">Strategic Objectives Status</p>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5 transition-all">{subtitle}</p>
        </div>
        <PieIcon size={15} className="text-[var(--text-muted)] flex-shrink-0" />
      </div>

      <div className="flex items-center gap-4 mt-3">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <PieChart width={90} height={90}>
            <Pie
              data={displayData}
              cx={40}
              cy={40}
              innerRadius={26}
              outerRadius={42}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              paddingAngle={displayData.length > 1 ? 2 : 0}
              strokeWidth={0}
            >
              {displayData.map(entry => (
                <Cell
                  key={entry.name}
                  fill={colorMap[entry.name] ?? '#DCE4F0'}
                />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-[var(--text)] font-sans">{total}</span>
            <span className="text-[9px] text-[var(--text-muted)] font-sans">{centerLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colorMap[d.name] ?? '#DCE4F0' }}
                />
                <span className="text-xs text-[var(--text-soft)] font-sans">{d.name}</span>
              </div>
              <span className="text-xs font-bold text-[var(--text)] font-sans">{d.value}</span>
            </div>
          ))}
        </div>

        <span className="text-3xl font-bold text-[var(--text-muted)] font-sans flex-shrink-0">{total}</span>
      </div>
    </div>
  )
}

// ── SO Progress Row ───────────────────────────────────────────────────────────

function SOProgressRow({ summary, isSelected, onClick }) {
  const chips = [
    summary.completed   > 0 && { label: `${summary.completed} completed`, color: '#2E7D32' },
    summary.advanced    > 0 && { label: `${summary.advanced} adv`,         color: '#1565C0' },
    summary.early       > 0 && { label: `${summary.early} early`,          color: '#B8943A' },
    summary.not_started > 0 && { label: `${summary.not_started} remaining`, color: '#9E9E9E' },
    summary.at_risk     > 0 && { label: `${summary.at_risk} at risk`,       color: '#C62828' },
  ].filter(Boolean)

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
        isSelected
          ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
          : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--text-muted)]'
      }`}
    >
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Number badge */}
        <div className="w-9 h-9 rounded-full bg-[var(--bg-soft)] border border-[var(--line)] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[var(--text)] font-sans">
            {summary.so_number.replace('SO', '')}
          </span>
        </div>

        {/* Title + chips */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-2 flex-wrap">
            <span className="font-semibold text-sm text-[#B8943A] font-sans">
              Strategic Objective {summary.so_number.replace('SO', '')}
            </span>
            {chips.map(c => (
              <span
                key={c.label}
                className="text-xs font-sans font-medium"
                style={{ color: c.color }}
              >
                · {c.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
            {summary.thematic_areas_count} thematic area{summary.thematic_areas_count !== 1 ? 's' : ''}
            {' · '}
            {summary.total_tasks} task{summary.total_tasks !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full sm:w-56 flex-shrink-0">
          <div className="h-2 rounded-full bg-[var(--bg-soft)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B8943A] transition-all duration-700"
              style={{ width: `${summary.overall_progress_pct}%` }}
            />
          </div>
        </div>

        {/* Percentage */}
        <div className="text-right flex-shrink-0 w-16">
          <p className="font-bold text-lg text-[var(--text)] font-sans leading-tight">
            {summary.overall_progress_pct}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-sans">progress</p>
        </div>
      </div>
    </div>
  )
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function CommentAvatar({ name, colorClass = 'bg-[#0A1F3D]' }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
      <span className="text-[10px] font-bold text-white font-sans">{initials}</span>
    </div>
  )
}

function ActivityFeed({ recentComments, currentUser, onRefresh }) {
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText,  setReplyText]  = useState('')
  const [posting,    setPosting]    = useState(false)

  const cancelReply = () => { setReplyingTo(null); setReplyText('') }

  const submitReply = async (comment) => {
    if (!replyText.trim() || posting) return
    setPosting(true)
    try {
      await api.post(
        `/activity-tracking/${comment.task_id}/${encodeURIComponent(comment.activity_ref)}/comments`,
        { content: replyText.trim(), author_name: currentUser?.name || 'DG' },
      )
      cancelReply()
      onRefresh?.()
    } catch (err) {
      console.error('reply failed:', err)
    } finally {
      setPosting(false)
    }
  }

  if (recentComments.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-8 text-center">
        <MessageSquare size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
        <p className="text-sm text-[var(--text-muted)] font-sans">No comments logged yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] divide-y divide-[var(--line)]">
      <div className="px-5 py-3">
        <p className="text-sm font-semibold text-[var(--text)] font-sans">Recent comments</p>
      </div>

      {recentComments.map(c => {
        const breadcrumb = [c.so_number, c.thematic_area, c.task_name, c.activity_ref]
          .filter(Boolean).join(' — ')
        const isReplying = replyingTo === c.id

        return (
          <div key={c.id} className="px-5 py-4">
            {/* Comment body */}
            <div className="flex gap-3">
              <CommentAvatar name={c.author_name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--text)] font-sans">{c.author_name}</span>
                  <span className="text-xs text-[var(--text-muted)] font-sans">{relTime(c.created_at)}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">{fmtDate(c.created_at)}</p>
                <p className="text-xs text-[#B8943A] font-sans mt-1 truncate" title={breadcrumb}>{breadcrumb}</p>
                <p className="text-sm text-[var(--text-soft)] font-sans mt-1">{c.content}</p>

                {/* Reply toggle */}
                {!isReplying && (
                  <button
                    onClick={() => { setReplyingTo(c.id); setReplyText('') }}
                    className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)] hover:text-[#B8943A] font-sans transition-colors"
                  >
                    <CornerDownRight size={12} />
                    Reply
                  </button>
                )}
              </div>
            </div>

            {/* Inline reply composer */}
            {isReplying && (
              <div className="mt-3 ml-11 flex gap-2">
                <CommentAvatar name={currentUser?.name || 'DG'} colorClass="bg-[#B8943A]" />
                <div className="flex-1">
                  <textarea
                    autoFocus
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply(c) }}
                    placeholder="Write a reply…"
                    rows={2}
                    className="w-full text-sm font-sans border border-[var(--line)] rounded-xl px-3 py-2 bg-[var(--bg-soft)] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[#B8943A] transition-colors"
                  />
                  <div className="flex items-center gap-2 mt-1.5 justify-end">
                    <button
                      onClick={cancelReply}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-sans transition-colors px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReply(c)}
                      disabled={!replyText.trim() || posting}
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
      })}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-28 skeleton rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-44 skeleton rounded-2xl" />)}
      </div>
      {[1, 2, 3, 4].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function DGDashboard() {
  useRealtimeSync()
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const tasks           = useDataStore(s => s.tasks)
  const summaries       = useDataStore(s => s.getSOSummaries())
  const soVisibility    = useDataStore(s => s.soVisibility)
  const totalComments   = useDataStore(s => s.totalComments)
  const recentComments  = useDataStore(s => s.recentComments)
  const fetchStats      = useDataStore(s => s.fetchStats)
  const fetchRecentComments = useDataStore(s => s.fetchRecentComments)

  const visibleSOs = summaries.filter(s => soVisibility[s.so_number] !== false)

  const [activeTab,  setActiveTab]  = useState('overview')
  const [selectedSO, setSelectedSO] = useState(null)

  useEffect(() => { fetchStats() },          [fetchStats])
  useEffect(() => { fetchRecentComments() }, [fetchRecentComments])

  const overallProgress = useMemo(() => {
    if (!tasks.length) return 0
    return Math.round(tasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / tasks.length)
  }, [tasks])

  const sosCompleted = visibleSOs.filter(s => s.overall_progress_pct >= 100).length

  const focusedSO = useMemo(
    () => visibleSOs.find(s => s.so_number === selectedSO) ?? null,
    [selectedSO, visibleSOs],
  )

  const totalThematicAreas = useMemo(
    () => new Set(tasks.map(t => `${t.so_number}::${t.thematic_area}`)).size,
    [tasks],
  )

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <Header showPrint />
        <main className="flex-1"><Skeleton /></main>
      </div>
    )
  }

  const toggleSO = (soNum) => setSelectedSO(prev => prev === soNum ? null : soNum)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header showPrint />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        <h1 className="text-2xl font-bold text-[var(--text)] font-sans">
          Workplan Master Dashboard
        </h1>

        <StatsBanner
          overallProgress={overallProgress}
          sosCompleted={sosCompleted}
          totalComments={totalComments}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HierarchyCard
            soCount={visibleSOs.length}
            areaCount={totalThematicAreas}
            taskCount={tasks.length}
          />
          <SOTrackerCard
            summaries={visibleSOs}
            selectedSO={selectedSO}
            onSelect={toggleSO}
          />
          <SOStatusCard summaries={visibleSOs} focusedSO={focusedSO} />
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-6 border-b border-[var(--line)]">
            {['overview', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-semibold font-sans capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-[#C62828] border-b-2 border-[#C62828]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab === 'overview' ? 'Overview' : 'Activity'}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-[var(--text)] font-sans">Strategic objective progress</p>
                    <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                      Select an objective to view its status breakdown above.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-soft)] border border-[var(--line)] px-2.5 py-1 rounded-md font-sans flex-shrink-0">
                    {visibleSOs.length} objectives
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  {visibleSOs.map(s => (
                    <SOProgressRow
                      key={s.so_number}
                      summary={s}
                      isSelected={selectedSO === s.so_number}
                      onClick={() => navigate(`/dashboard/so/${s.so_number}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <div className="mt-6">
              <ActivityFeed
                recentComments={recentComments}
                currentUser={user}
                onRefresh={fetchRecentComments}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
