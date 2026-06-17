import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const STATUS_COLORS = {
  'Not Started': '#DCE4F0',
  'In Progress':  '#B8943A',
  'Completed':    '#2E7D32',
  'On Hold':      '#E65100',
  'At Risk':      '#C62828',
  'Cancelled':    '#757575',
}

export function StatusPieChart({ summary }) {
  const data = [
    { name: 'Not Started', value: summary.not_started },
    { name: 'In Progress',  value: summary.in_progress },
    { name: 'Completed',    value: summary.completed },
    { name: 'On Hold',      value: summary.on_hold },
    { name: 'At Risk',      value: summary.at_risk },
    { name: 'Cancelled',    value: summary.cancelled || 0 },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => [v, name]}
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', color: 'var(--text-soft)' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
