import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/shared/Toast'
import { LoginPage } from './components/auth/LoginPage'
import { SignUpPage } from './components/auth/SignUpPage'
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DGDashboard } from './components/dashboard/DGDashboard'
import { DGSODetailPage } from './components/dashboard/DGSODetailPage'
import { ManagementHome } from './components/management/ManagementHome'
import { SODetailPage } from './components/management/SODetailPage'
import { ThematicAreaPage } from './components/management/ThematicAreaPage'
import { TaskDetailPage } from './components/management/TaskDetailPage'

function AppInit() {
  useEffect(() => {
    const theme = localStorage.getItem('clet_theme')
    if (theme === 'dark') document.documentElement.classList.add('dark')
  }, [])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInit />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['dg', 'management']}>
                <DGDashboard />
              </ProtectedRoute>
            } />

            <Route path="/dashboard/so/:soNumber" element={
              <ProtectedRoute allowedRoles={['dg', 'management']}>
                <DGSODetailPage />
              </ProtectedRoute>
            } />

            <Route path="/management" element={
              <ProtectedRoute allowedRoles={['management']}>
                <ManagementHome />
              </ProtectedRoute>
            } />

            <Route path="/management/so/:soNumber" element={
              <ProtectedRoute allowedRoles={['management', 'dg']}>
                <SODetailPage />
              </ProtectedRoute>
            } />

            <Route path="/management/so/:soNumber/area/:areaIndex" element={
              <ProtectedRoute allowedRoles={['management', 'dg']}>
                <ThematicAreaPage />
              </ProtectedRoute>
            } />

            <Route path="/management/so/:soNumber/area/:areaIndex/task/:taskId" element={
              <ProtectedRoute allowedRoles={['management']}>
                <TaskDetailPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
