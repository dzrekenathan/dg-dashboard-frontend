import { useState, useMemo } from 'react'
import { Download, Search, X } from 'lucide-react'
import { ExcelImporter } from './ExcelImporter'
import { TaskUpdateForm } from './TaskUpdateForm'
import useDataStore from '../../store/useDataStore'
import { exportToExcel } from '../../utils/excelExporter'
import { useAuth } from '../../context/AuthContext'

const SO_TABS = ['SO1', 'SO2', 'SO3', 'SO4']
const STATUSES = ['All', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'At Risk', 'Cancelled']

export function EditPanel() {
  const tasks  = useDataStore(s => s.tasks)
  const { user } = useAuth()

  const [activeTab, setActiveTab]     = useState('SO1')
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const thematicAreas = useMemo(() => {
    const soTasks = tasks.filter(t => t.so_number === activeTab)
    return [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
  }, [tasks, activeTab])

  const [areaFilter, setAreaFilter] = useState('All')

  const filtered = useMemo(() => {
    return tasks
      .filter(t => t.so_number === activeTab)
      .filter(t => statusFilter === 'All' || t.status === statusFilter)
      .filter(t => areaFilter === 'All' || t.thematic_area === areaFilter)
      .filter(t => {
        if (!search) return true
        const q = search.toLowerCase()
        return t.task?.toLowerCase().includes(q) || t.activities?.toLowerCase().includes(q) || t.thematic_area?.toLowerCase().includes(q)
      })
  }, [tasks, activeTab, search, statusFilter, areaFilter])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-soft)]">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-[var(--line)] bg-[#0A1F3D]">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-sans font-bold text-white text-base">Management Update Panel</h2>
              <p className="text-xs text-white/50 font-sans">{user?.name}</p>
            </div>
            <div className="flex gap-2">
              <ExcelImporter />
              <button
                onClick={() => exportToExcel(tasks)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#806014] hover:bg-[#B8943A] text-white text-xs font-semibold transition-colors"
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SO Tabs */}
      <div className="flex border-b border-[var(--line)] bg-[var(--bg)]">
        {SO_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setAreaFilter('All') }}
            className={`px-5 py-3 text-xs font-semibold font-sans transition-colors relative ${
              activeTab === tab
                ? 'text-[#806014] dark:text-[#B8943A]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#806014]" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-[var(--line-soft)] bg-[var(--bg)] flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-navy"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs px-2 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          className="text-xs px-2 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)] focus:outline-none max-w-[140px]"
        >
          <option value="All">All Areas</option>
          {thematicAreas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm font-sans">
            {tasks.length === 0 ? 'No data loaded. Import an Excel file to begin.' : 'No tasks match the current filters.'}
          </div>
        ) : (
          filtered.map(task => <TaskUpdateForm key={task.id} task={task} />)
        )}
      </div>

      <div className="px-4 py-2 text-[10px] text-[var(--text-muted)] font-sans border-t border-[var(--line-soft)] bg-[var(--bg)]">
        Showing {filtered.length} of {tasks.filter(t => t.so_number === activeTab).length} tasks in {activeTab}
      </div>
    </div>
  )
}
