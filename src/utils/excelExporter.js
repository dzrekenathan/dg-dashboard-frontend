import * as XLSX from 'xlsx'

export function exportToExcel(tasks) {
  const rows = tasks.map(t => ({
    'SO #':                       t.so_number,
    'Strategic Objective':        t.so_title,
    'Thematic Area':              t.thematic_area,
    'Task':                       t.task,
    'Reference Nos.':             t.reference_numbers,
    'Activities & Sub-Activities': t.activities,
    'Timeframe':                  t.timeframe,
    'Responsibility':             t.responsibility,
    'Outputs / Deliverables':     t.outputs,
    'Outcomes / Impact':          t.outcomes,
    'Risks & Mitigation':         t.risks_mitigation,
    'Budget':                     t.budget,
    'Status':                     t.status,
    'Progress %':                 t.progress_pct,
    'Assigned To':                t.assigned_to,
    'Target Date':                t.target_date,
    'Notes / Comments':           t.notes,
    'Last Updated':               t.last_updated,
    'Updated By':                 t.updated_by,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column width hints
  const colWidths = [8,35,25,40,15,50,15,25,40,40,35,15,15,12,20,15,40,20,20]
  ws['!cols'] = colWidths.map(w => ({ wch: w }))

  XLSX.utils.book_append_sheet(wb, ws, 'SO Matrix')
  XLSX.writeFile(wb, `CLET_SO_Matrix_Export_${new Date().toISOString().slice(0,10)}.xlsx`)
}
