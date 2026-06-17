import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { parseExcelFile } from '../../utils/excelParser'
import useDataStore from '../../store/useDataStore'
import { useToast } from '../shared/Toast'

export function ExcelImporter() {
  const fileRef  = useRef()
  const setTasks = useDataStore(s => s.setTasks)
  const toast    = useToast()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const tasks = await parseExcelFile(file)
      if (tasks.length === 0) { toast('No valid rows found in file', 'error'); return }
      setTasks(tasks)
      toast(`Excel imported — ${tasks.length} rows loaded`, 'info', 4000)
    } catch (err) {
      toast('Error: invalid file format or missing "SO Matrix" sheet', 'error', 5000)
    }
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] hover:bg-[var(--burgundy-pale)] text-[var(--text)] text-xs font-semibold transition-colors"
      >
        <Upload size={14} />
        Import Excel
      </button>
    </>
  )
}
