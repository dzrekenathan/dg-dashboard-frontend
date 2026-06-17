const BASE = import.meta.env.VITE_API_URL || 'https://dg-dashboard-46b3.onrender.com'

function getToken() {
  return localStorage.getItem('clet_token')
}

async function request(method, path, body, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    ...options,
  })

  if (res.status === 401) {
    localStorage.removeItem('clet_token')
    localStorage.removeItem('clet_session')
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),

  // File upload (no JSON Content-Type)
  upload: async (path, formData) => {
    const token = getToken()
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Upload failed')
    }
    return res.json()
  },

  // Streaming download
  download: async (path, filename) => {
    const token = getToken()
    const res = await fetch(`${BASE}${path}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}

export const WS_URL = BASE.replace(/^http/, 'ws') + '/ws'
