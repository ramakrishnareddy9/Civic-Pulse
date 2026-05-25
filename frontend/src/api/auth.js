import { post, get } from './client'

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - Email
 * @param {string} userData.fullName - Full name
 * @param {string} userData.password - Password
 * @param {string} [userData.phone] - Phone number
 * @returns {Promise<{user: User, token: string}>}
 */
export const register = async (userData) => {
  return post('/api/auth/register', {
    email: userData.email,
    fullName: userData.fullName,
    password: userData.password,
    phone: userData.phone || '',
  })
}

/**
 * Login user
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {Promise<{user: User, token: string}>}
 */
export const login = async (email, password) => {
  return post('/api/auth/login', {
    email,
    password,
  })
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  return post('/api/auth/logout', {})
}

/**
 * Get current user profile
 * @returns {Promise<User>}
 */
export const getCurrentUser = async () => {
  return get('/api/auth/me')
}

/**
 * Verify email token
 * @param {string} token - Verification token
 * @returns {Promise<void>}
 */
export const verifyEmail = async (token) => {
  return post('/api/auth/verify-email', { token })
}

/**
 * Request password reset
 * @param {string} email - Email
 * @returns {Promise<{message: string}>}
 */
export const requestPasswordReset = async (email) => {
  return post('/api/auth/forgot-password', { email })
}

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const resetPassword = async (token, newPassword) => {
  return post('/api/auth/reset-password', {
    token,
    newPassword,
  })
}

/**
 * Change password
 * @param {string} oldPassword - Old password
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const changePassword = async (oldPassword, newPassword) => {
  return post('/api/auth/change-password', {
    oldPassword,
    newPassword,
  })
}

/**
 * Refresh auth token
 * @returns {Promise<{token: string}>}
 */
export const refreshToken = async () => {
  return post('/api/auth/refresh', {})
}
