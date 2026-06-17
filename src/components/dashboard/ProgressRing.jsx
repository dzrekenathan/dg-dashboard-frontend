import { useEffect, useState } from 'react'

export function ProgressRing({ value = 0, size = 80, strokeWidth = 7, label = '' }) {
  const [displayed, setDisplayed] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayed / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const id = `grad-${label.replace(/\s/g, '')}`

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#14305C" />
            <stop offset="100%" stopColor="#806014" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#DCE4F0" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif font-bold text-[#0A1F3D] dark:text-white" style={{ fontSize: size * 0.22 }}>
          {displayed}%
        </span>
      </div>
    </div>
  )
}
