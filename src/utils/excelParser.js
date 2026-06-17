import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const wsName = wb.SheetNames.includes('SO Matrix') ? 'SO Matrix' : wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const tasks = data
          .filter(row => row['SO #'] || row['SO#'] || row['so_number'])
          .map(row => ({
            id: uuidv4(),
            so_number:         String(row['SO #'] || row['SO#'] || row['so_number'] || ''),
            so_title:          String(row['Strategic Objective'] || row['so_title'] || ''),
            thematic_area:     String(row['Thematic Area'] || row['thematic_area'] || ''),
            task:              String(row['Task'] || row['task'] || ''),
            reference_numbers: String(row['Reference Nos.'] || row['Reference No.'] || row['reference_numbers'] || ''),
            activities:        String(row['Activities & Sub-Activities'] || row['Activities'] || row['activities'] || ''),
            timeframe:         String(row['Timeframe'] || row['timeframe'] || ''),
            responsibility:    String(row['Responsibility'] || row['responsibility'] || ''),
            outputs:           String(row['Outputs / Deliverables'] || row['Outputs'] || row['outputs'] || ''),
            outcomes:          String(row['Outcomes / Impact'] || row['Outcomes'] || row['outcomes'] || ''),
            risks_mitigation:  String(row['Risks & Mitigation'] || row['Risks'] || row['risks_mitigation'] || ''),
            budget:            String(row['Budget'] || row['budget'] || ''),
            status:            String(row['Status'] || row['status'] || 'Not Started'),
            progress_pct:      Number(row['Progress %'] || row['progress_pct'] || 0),
            assigned_to:       String(row['Assigned To'] || row['assigned_to'] || ''),
            target_date:       String(row['Target Date'] || row['target_date'] || ''),
            notes:             String(row['Notes / Comments'] || row['Notes'] || row['notes'] || ''),
            last_updated:      String(row['Last Updated'] || row['last_updated'] || ''),
            updated_by:        String(row['Updated By'] || row['updated_by'] || ''),
          }))
        resolve(tasks)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
