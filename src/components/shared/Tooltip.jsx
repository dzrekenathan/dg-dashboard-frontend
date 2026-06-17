import { useState } from 'react'

export function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-navy-deep text-white text-xs rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-deep" />
        </span>
      )}
    </span>
  )
}
