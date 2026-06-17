const STATUS_STYLES = {
  'Not Started': 'bg-[#DCE4F0] text-[#1F4480]',
  'In Progress':  'bg-[#FFF9E6] text-[#806014]',
  'Completed':    'bg-[#E8F5E9] text-[#2E7D32]',
  'On Hold':      'bg-[#FFF3E0] text-[#E65100]',
  'At Risk':      'bg-[#FDECEA] text-[#C62828]',
  'Cancelled':    'bg-[#F5F5F5] text-[#616161]',
}

export function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-sans ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status || 'Unknown'}
    </span>
  )
}
