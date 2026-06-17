export function ProgressBar({ value = 0, className = '', showLabel = true }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 80 ? '#2E7D32' : pct >= 50 ? '#806014' : pct > 0 ? '#1F4480' : '#DCE4F0'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-[var(--burgundy-pale)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--text-soft)] w-8 text-right">
          {pct}%
        </span>
      )}
    </div>
  )
}
