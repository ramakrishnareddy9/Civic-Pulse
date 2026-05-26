import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@hooks/useAuth'
import { useAuthStore } from '@store/authStore'
import { useUiStore } from '@store/uiStore'
import { ROUTES } from '@utils/constants'
import ErrorBoundary from '@components/common/ErrorBoundary'
import { LoginPage } from '@pages/LoginPage'
import { RegisterPage } from '@pages/RegisterPage'
import { ResetPasswordPage } from '@pages/ResetPasswordPage'
import { CitizenDashboard } from '@pages/CitizenDashboard'
import { ComplaintForm } from '@pages/ComplaintForm'
import { ComplaintDetail } from '@pages/ComplaintDetail'
import { OfficerDashboard } from '@pages/OfficerDashboard'
import { AdminDashboard } from '@pages/AdminDashboard'
import AdminDepartments from '@pages/AdminDepartments'
import AdminOfficers from '@pages/AdminOfficers'
import AdminWards from '@pages/AdminWards'
import { LandingPage } from '@pages/LandingPage'
import { NotificationCenter } from '@pages/NotificationCenter'
import './App.css'
import Header from '@components/common/Header'

/**
 * 404 Not Found page
 */
function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 text-center" style={{ background: 'var(--gov-surface)' }}>
      <div className="animate-fade-in">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(10,35,66,0.08)' }}>
          <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--gov-navy)' }}>error_outline</span>
        </div>
        <h1 className="text-6xl font-black mb-3" style={{ color: 'var(--gov-navy)' }}>404</h1>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--gov-text)' }}>Page Not Found</h2>
        <p className="mb-8 max-w-sm mx-auto" style={{ color: 'var(--gov-text-muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="/" className="gov-btn-primary" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined text-sm">home</span>
            Go to Home
          </a>
          <button onClick={() => window.history.back()} className="gov-btn-outline">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Go Back
          </button>
        </div>
        <div className="mt-12 p-4 rounded-xl border text-sm" style={{ background: 'white', borderColor: 'var(--gov-border)', color: 'var(--gov-text-muted)', maxWidth: '360px', margin: '48px auto 0' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--gov-navy)' }}>Need help?</p>
          <p>Contact the Civic Pulse helpdesk at <a href="tel:1800-123-4567" style={{ color: 'var(--gov-blue)' }}>1800-123-4567</a></p>
        </div>
      </div>
    </div>
  )
}

/**
 * Role-based dashboard redirect
 */
function RoleDashboardRedirect({ user }) {
  if (user?.role === 'CITIZEN') return <Navigate to={ROUTES.CITIZEN.DASHBOARD} replace />
  if (user?.role === 'OFFICER') return <Navigate to={ROUTES.OFFICER.DASHBOARD} replace />
  if (user?.role === 'ADMIN' || user?.role === 'DEPT_HEAD') return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />
  return <Navigate to={ROUTES.LOGIN} replace />
}

/**
 * Root App component with routing setup
 */
function App() {
  const { isAuthenticated, user } = useAuth()
  const { notifications } = useUiStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const checkHydration = () => {
      if (useAuthStore.persist?.hasHydrated()) {
        setHydrated(true)
      } else {
        setTimeout(checkHydration, 10)
      }
    }
    checkHydration()
  }, [])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ background: 'var(--gov-surface)' }}>
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl animate-spin" style={{ color: 'var(--gov-navy)' }}>sync</span>
          <p className="text-sm font-bold" style={{ color: 'var(--gov-navy)' }}>Verifying credentials...</p>
        </div>
      </div>
    )
  }

  /**
   * Protected route wrapper with optional role checking (supports multiple roles)
   */
  const ProtectedRoute = ({ children, requiredRoles = null }) => {
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />
    }

    // Support both array of roles and single role for backwards compatibility
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : (requiredRoles ? [requiredRoles] : null)
    if (rolesArray && !rolesArray.includes(user?.role)) {
      return <RoleDashboardRedirect user={user} />
    }

    return children
  }

  /**
   * Public routes (redirect to dashboard if already logged in)
   */
  const PublicRoute = ({ children }) => {
    if (isAuthenticated) {
      return <RoleDashboardRedirect user={user} />
    }
    return children
  }

  return (
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--gov-surface)' }}>
        <Header />
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.RESET_PASSWORD}
            element={<ResetPasswordPage />}
          />

          {/* Home Route */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />

          {/* Dashboard Route (role-based) */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <RoleDashboardRedirect user={user} />
              </ProtectedRoute>
            }
          />

          {/* Citizen Routes */}
          <Route
            path={ROUTES.CITIZEN.DASHBOARD}
            element={
              <ProtectedRoute requiredRoles="CITIZEN">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CITIZEN.SUBMIT_COMPLAINT}
            element={
              <ProtectedRoute requiredRoles="CITIZEN">
                <ComplaintForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/complaints/:id"
            element={
              <ProtectedRoute requiredRoles="CITIZEN">
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Officer Routes */}
          <Route
            path={ROUTES.OFFICER.DASHBOARD}
            element={
              <ProtectedRoute requiredRoles="OFFICER">
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/complaints/:id"
            element={
              <ProtectedRoute requiredRoles="OFFICER">
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path={ROUTES.ADMIN.DASHBOARD}
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'DEPT_HEAD']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'DEPT_HEAD']}>
                <AdminDepartments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/officers"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'DEPT_HEAD']}>
                <AdminOfficers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wards"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'DEPT_HEAD']}>
                <AdminWards />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(10,35,66,0.15)',
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#1b5e20', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#b71c1c', secondary: 'white' },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
