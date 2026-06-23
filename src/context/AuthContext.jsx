import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

const SESSION_KEY = 'clet_session'
const TOKEN_KEY   = 'clet_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setUser(null); return }
    api.get('/auth/me')
      .then(data => {
        const session = { userId: data.id, role: data.role, name: data.name, email: data.email, directorate: data.directorate ?? null }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        setUser(session)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      })
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password })
      localStorage.setItem(TOKEN_KEY, data.access_token)
      const session = { userId: null, role: data.role, name: data.name, email: data.email, directorate: data.directorate ?? null }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
