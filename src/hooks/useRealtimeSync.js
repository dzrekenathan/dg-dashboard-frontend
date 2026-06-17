import { useEffect, useRef } from 'react'
import { WS_URL } from '../api/client'
import useDataStore from '../store/useDataStore'

function handleMessage(e, fetchTasks, setVisibility) {
  if (e.data === 'pong') return
  let msg
  try { msg = JSON.parse(e.data) } catch { return }

  if (msg.type === 'TASKS_UPDATED' || msg.type === 'TASK_UPDATED') {
    fetchTasks()
  } else if (msg.type === 'VISIBILITY_UPDATED') {
    setVisibility(msg.payload)
  }
}

function startPing(ws) {
  return setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send('ping')
  }, 25000)
}

export function useRealtimeSync() {
  const fetchTasks      = useDataStore(s => s.fetchTasks)
  const fetchVisibility = useDataStore(s => s.fetchVisibility)
  const setVisibility   = useDataStore(s => s.setVisibility)
  const wsRef           = useRef(null)
  const pingRef         = useRef(null)

  useEffect(() => {
    fetchTasks()
    fetchVisibility()

    function connect() {
      const token = localStorage.getItem('clet_token')
      if (!token) return

      const ws = new WebSocket(`${WS_URL}?token=${token}`)
      wsRef.current = ws

      ws.onopen  = () => { pingRef.current = startPing(ws) }
      ws.onmessage = (e) => handleMessage(e, fetchTasks, setVisibility)
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        clearInterval(pingRef.current)
        if (wsRef.current === ws) setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearInterval(pingRef.current)
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
    }
  }, [])
}
