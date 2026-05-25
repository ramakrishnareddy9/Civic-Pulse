import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@hooks/useAuth'
import { useUiStore } from '@store/uiStore'
import { ROUTES } from '@utils/constants'
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
 * Root App component with routing setup
 */
function App() {
  const { isAuthenticated, user } = useAuth()
  const { notifications } = useUiStore()

  /**
   * Protected route wrapper with optional role checking
   */
  const ProtectedRoute = ({ children, requiredRole = null }) => {
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />
    }

    if (requiredRole && user?.role !== requiredRole) {
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }

    return children
  }

  /**
   * Public routes (redirect to dashboard if already logged in)
   */
  const PublicRoute = ({ children }) => {
    if (isAuthenticated) {
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
    return children
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
                {user?.role === 'CITIZEN' && <Navigate to={ROUTES.CITIZEN.DASHBOARD} replace />}
                {user?.role === 'OFFICER' && <Navigate to={ROUTES.OFFICER.DASHBOARD} replace />}
                {user?.role === 'ADMIN' && <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />}
              </ProtectedRoute>
            }
          />

          {/* Citizen Routes */}
          <Route
            path={ROUTES.CITIZEN.DASHBOARD}
            element={
              <ProtectedRoute requiredRole="CITIZEN">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CITIZEN.SUBMIT_COMPLAINT}
            element={
              <ProtectedRoute requiredRole="CITIZEN">
                <ComplaintForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/complaints/:id"
            element={
              <ProtectedRoute requiredRole="CITIZEN">
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Officer Routes */}
          <Route
            path={ROUTES.OFFICER.DASHBOARD}
            element={
              <ProtectedRoute requiredRole="OFFICER">
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/complaints/:id"
            element={
              <ProtectedRoute requiredRole="OFFICER">
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
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDepartments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/officers"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminOfficers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wards"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminWards />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App

