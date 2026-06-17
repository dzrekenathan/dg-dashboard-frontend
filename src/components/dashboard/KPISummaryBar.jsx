import { SOProgressCard } from './SOProgressCard'

export function KPISummaryBar({ summaries }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {summaries.map(s => (
        <SOProgressCard key={s.so_number} summary={s} />
      ))}
    </div>
  )
}
