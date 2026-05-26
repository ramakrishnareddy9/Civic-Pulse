import { useCallback } from 'react'
import { useAuthStore } from '@store/authStore'
import * as authService from '@api/auth'
import { handleApiError } from '@api/client'

/**
 * Custom hook for authentication operations
 * @returns {Object} Auth methods and state
 */
export const useAuth = () => {
  const { user, token, isAuthenticated, loading, error, setAuth, logout, setLoading, setError } =
    useAuthStore()

  /**
   * Login user
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<boolean>} Success status
   */
  const login = useCallback(
    async (email, password) => {
      try {
        setLoading(true)
        setError(null)

        // Frontend-only dummy account login interceptor
        const lowerEmail = email.toLowerCase()
        if (
          lowerEmail === 'admin@civicpulse.gov.in' ||
          lowerEmail === 'officer@civicpulse.gov.in' ||
          lowerEmail === 'citizen@civicpulse.gov.in' ||
          lowerEmail.startsWith('dummy-')
        ) {
          let role = 'CITIZEN'
          let fullName = 'Sarah Jenkins'
          if (lowerEmail.includes('admin')) {
            role = 'ADMIN'
            fullName = 'Chief Administrator'
          } else if (lowerEmail.includes('officer')) {
            role = 'OFFICER'
            fullName = 'Officer James Smith'
          }

          const dummyUser = {
            id: 999,
            email: lowerEmail,
            fullName,
            role,
            createdAt: new Date().toISOString(),
          }
          const dummyToken = 'dummy-jwt-token-for-local-testing'
          setAuth(dummyUser, dummyToken, null)
          localStorage.setItem('token', dummyToken)
          return true
        }

        const { user: userData, token: authToken, refreshToken: authRefreshToken } = await authService.login(email, password)
        setAuth(userData, authToken, authRefreshToken)
        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, setAuth]
  )

  /**
   * Register user
   * @param {Object} userData - User data
   * @returns {Promise<boolean>} Success status
   */
  const register = useCallback(
    async (userData) => {
      try {
        setLoading(true)
        setError(null)
        await authService.register(userData)
        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError]
  )

  /**
   * Logout user
   */
  const handleLogout = useCallback(
    async () => {
      try {
        await authService.logout()
      } catch (err) {
        console.error('Logout error:', err)
      } finally {
        logout()
      }
    },
    [logout]
  )

  /**
   * Change password
   * @param {string} oldPassword - Old password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  const changePassword = useCallback(
    async (oldPassword, newPassword) => {
      try {
        setLoading(true)
        setError(null)
        await authService.changePassword(oldPassword, newPassword)
        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError]
  )

  /**
   * Request password reset
   * @param {string} email - Email
   * @returns {Promise<boolean>} Success status
   */
  const requestPasswordReset = useCallback(
    async (email) => {
      try {
        setLoading(true)
        setError(null)
        await authService.requestPasswordReset(email)
        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError]
  )

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  const resetPassword = useCallback(
    async (token, newPassword) => {
      try {
        setLoading(true)
        setError(null)
        await authService.resetPassword(token, newPassword)
        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError]
  )

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout: handleLogout,
    changePassword,
    requestPasswordReset,
    resetPassword,
  }
}
