import { useState, useRef, useCallback } from 'react'
import { Header } from '../layout/Header'
import { EditPanel } from './EditPanel'
import { LivePreview } from './LivePreview'

export function ManagementDashboard() {
  const [leftWidth, setLeftWidth] = useState(50) // percent
  const containerRef = useRef(null)
  const dragging     = useRef(false)

  const onMouseDown = useCallback(() => { dragging.current = true }, [])

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = ((e.clientX - rect.left) / rect.width) * 100
    setLeftWidth(Math.min(65, Math.max(35, pct)))
  }, [])

  const onMouseUp = useCallback(() => { dragging.current = false }, [])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-[var(--bg)]"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <Header title="Management Update Panel" />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left — Edit Panel */}
        <div className="overflow-hidden" style={{ width: `${leftWidth}%` }}>
          <EditPanel />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="w-1.5 bg-[var(--line)] hover:bg-[#806014] cursor-col-resize transition-colors flex-shrink-0 select-none"
          title="Drag to resize"
        />

        {/* Right — Live Preview */}
        <div className="overflow-hidden flex-1">
          <LivePreview />
        </div>
      </div>
    </div>
  )
}
