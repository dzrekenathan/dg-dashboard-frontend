import { useState, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle size={16} className="text-green-600" />,
  error:   <AlertCircle size={16} className="text-red-600" />,
  info:    <Info size={16} className="text-blue-600" />,
}

const BG = {
  success: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
  error:   'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
  info:    'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container no-print">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg min-w-[240px] max-w-sm font-sans text-sm text-[var(--text)] bg-[var(--bg)] ${BG[t.type]}`}
            >
              {ICONS[t.type]}
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
