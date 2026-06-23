import { create } from 'zustand'
import { api } from '../api/client'
import { parseDirectorateFromArea, SO_SHORT_TITLES } from '../utils/helpers'

const DEFAULT_VISIBILITY = { SO1: true, SO2: true, SO3: true, SO4: true }

const useDataStore = create((set, get) => ({
  tasks: [],
  lastSync: null,
  soVisibility: DEFAULT_VISIBILITY,
  loading: false,
  totalComments: 0,
  recentComments: [],

  // ── Tasks ──────────────────────────────────────────────────────────────────

  fetchTasks: async () => {
    try {
      const tasks = await api.get('/tasks')
      set({ tasks, lastSync: new Date().toISOString() })
    } catch (err) {
      console.error('fetchTasks:', err)
    }
  },

  updateTask: async (id, fields) => {
    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...fields } : t),
    }))
    try {
      await api.patch(`/tasks/${id}`, fields)
      set({ lastSync: new Date().toISOString() })
    } catch (err) {
      console.error('updateTask:', err)
      // Revert on failure
      get().fetchTasks()
    }
  },

  // Called when a WebSocket TASKS_UPDATED event arrives
  reloadTasks: async () => {
    await get().fetchTasks()
  },

  // ── SO Visibility ──────────────────────────────────────────────────────────

  fetchVisibility: async () => {
    try {
      const data = await api.get('/so-visibility')
      set({ soVisibility: data })
    } catch (err) {
      console.error('fetchVisibility:', err)
    }
  },

  toggleSOVisibility: async (soNumber) => {
    // Optimistic toggle
    set(state => ({
      soVisibility: { ...state.soVisibility, [soNumber]: !state.soVisibility[soNumber] },
    }))
    try {
      const updated = await api.patch(`/so-visibility/${soNumber}`)
      set({ soVisibility: updated })
    } catch (err) {
      console.error('toggleSOVisibility:', err)
      get().fetchVisibility()
    }
  },

  // Called when a WebSocket VISIBILITY_UPDATED event arrives
  setVisibility: (visibilityMap) => {
    set({ soVisibility: visibilityMap })
  },

  fetchStats: async () => {
    try {
      const data = await api.get('/activity-tracking/stats')
      set({ totalComments: data.total_comments })
    } catch (err) {
      console.error('fetchStats:', err)
    }
  },

  fetchRecentComments: async () => {
    try {
      const data = await api.get('/activity-tracking/recent')
      set({ recentComments: data })
    } catch (err) {
      console.error('fetchRecentComments:', err)
    }
  },

  // ── Summaries (computed, no API call) ──────────────────────────────────────

  getSOSummaries: () => {
    const tasks = get().tasks
    return ['SO1', 'SO2', 'SO3', 'SO4'].map(so => {
      const soTasks = tasks.filter(t => t.so_number === so)
      return {
        so_number: so,
        so_title: soTasks[0]?.so_title ?? '',
        total_tasks: soTasks.length,
        thematic_areas_count: new Set(soTasks.map(t => t.thematic_area)).size,
        completed:   soTasks.filter(t => t.status === 'Completed').length,
        advanced:    soTasks.filter(t => t.status === 'Advanced').length,
        early:       soTasks.filter(t => t.status === 'Early' || t.status === 'In Progress').length,
        in_progress: soTasks.filter(t => t.status === 'In Progress').length,
        not_started: soTasks.filter(t => t.status === 'Not Started').length,
        on_hold:     soTasks.filter(t => t.status === 'On Hold').length,
        at_risk:     soTasks.filter(t => t.status === 'At Risk').length,
        cancelled:   soTasks.filter(t => t.status === 'Cancelled').length,
        overall_progress_pct: soTasks.length
          ? Math.round(soTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / soTasks.length)
          : 0,
      }
    })
  },

  getDirectorateAreas: (directorate) => {
    const tasks = get().tasks
    const result = []

    for (const so of ['SO1', 'SO2', 'SO3', 'SO4']) {
      const soTasks = tasks.filter(t => t.so_number === so)
      const allAreas = [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
        .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))

      const dirAreas = allAreas
        .map((area, idx) => {
          if (parseDirectorateFromArea(area) !== directorate) return null
          const areaTasks = soTasks.filter(t => t.thematic_area === area)
          return {
            area,
            idx,
            total:       areaTasks.length,
            completed:   areaTasks.filter(t => t.status === 'Completed').length,
            in_progress: areaTasks.filter(t => t.status === 'In Progress').length,
            at_risk:     areaTasks.filter(t => t.status === 'At Risk').length,
            progress_pct: areaTasks.length
              ? Math.round(areaTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / areaTasks.length)
              : 0,
          }
        })
        .filter(Boolean)

      if (dirAreas.length > 0) {
        result.push({
          so_number: so,
          so_title: soTasks[0]?.so_title || SO_SHORT_TITLES[so] || so,
          areas: dirAreas,
        })
      }
    }
    return result
  },
}))

export default useDataStore
