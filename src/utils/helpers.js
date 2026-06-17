export const SO_ADINKRA = {
  SO1: {
    symbol:      '/assets/adinkra/nserewa-navy.png',
    symbolGold:  '/assets/adinkra/nyansapo-gold.png',
    symbolWhite: '/assets/adinkra/mmara-krado-white.png',
    meaning:     'Nserewa — prosperity and abundance (Access)',
    color:       '#F2F5FA',
    darkColor:   '#131F33',
  },
  SO2: {
    symbol:      '/assets/adinkra/nyansapo-navy.png',
    symbolGold:  '/assets/adinkra/nyansapo-gold.png',
    symbolWhite: '/assets/adinkra/hwemudua-white.png',
    meaning:     'Nyansapo — wisdom knot (Curriculum & Knowledge)',
    color:       '#EEF0FA',
    darkColor:   '#141628',
  },
  SO3: {
    symbol:      '/assets/adinkra/mmara-krado-navy.png',
    symbolGold:  '/assets/adinkra/mmara-krado-gold.png',
    symbolWhite: '/assets/adinkra/mmara-krado-white.png',
    meaning:     'Mmara Krado — padlock of law (Standards & Regulation)',
    color:       '#EEF7EE',
    darkColor:   '#131E13',
  },
  SO4: {
    symbol:      '/assets/adinkra/adinkra-hene-navy.png',
    symbolGold:  '/assets/adinkra/nyansapo-gold.png',
    symbolWhite: '/assets/adinkra/adinkra-hene-white.png',
    meaning:     'Adinkra Hene — king of symbols (Governance)',
    color:       '#FDF7EE',
    darkColor:   '#1E1A10',
  },
}

export const SO_DEPT_LOGOS = {
  SO1: ['/assets/logos/clet-dti.png', '/assets/logos/clet-leat.png'],
  SO2: ['/assets/logos/clet-cdt.png', '/assets/logos/clet-aqai.png', '/assets/logos/clet-leat.png'],
  SO3: ['/assets/logos/clet-lrks.png', '/assets/logos/clet-aqai.png', '/assets/logos/clet-rmf.png'],
  SO4: ['/assets/logos/clet-dti.png', '/assets/logos/clet-rmf.png', '/assets/logos/clet-pc.png'],
}

export const SO_SHORT_TITLES = {
  SO1: 'Access & Decongestion',
  SO2: 'Curriculum & Training',
  SO3: 'Standards & Regulation',
  SO4: 'Governance & Funding',
}

export const STATUS_COLORS = {
  'Not Started': '#DCE4F0',
  'In Progress':  '#B8943A',
  'Completed':    '#2E7D32',
  'On Hold':      '#E65100',
  'At Risk':      '#C62828',
  'Cancelled':    '#757575',
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getAreaAbbrev(areaName) {
  const name = areaName.replace(/^\d+\.\s*/, '')
  const tokens = name.split(/\s+/)
  let abbrev = ''
  for (const t of tokens) {
    if (abbrev.length >= 3) break
    if (t === '&') abbrev += '&'
    else if (t.length >= 2) abbrev += t[0].toUpperCase()
  }
  return abbrev || name.slice(0, 3).toUpperCase()
}

function makeActivity(line) {
  const m = line.match(/^(\d+\.\d+\.\d+)\s+(.+)$/)
  return { ref: m?.[1] ?? '', title: m?.[2] ?? line, subActivities: [] }
}

export function parseActivities(text) {
  if (!text) return []
  const activities = []
  let current = null
  for (const line of text.split('\n').map(l => l.trim()).filter(Boolean)) {
    const isMain = /^\d+\.\d+\.\d+ /.test(line) && !/^\d+\.\d+\.\d+\.\d+/.test(line)
    if (isMain) {
      if (current) activities.push(current)
      current = makeActivity(line)
    } else if (current) {
      current.subActivities.push(line)
    }
  }
  if (current) activities.push(current)
  return activities
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
