/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  COMPLAINTS: {
    BASE: '/api/complaints',
    DETAIL: (id) => `/api/complaints/${id}`,
    USER: (email) => `/api/complaints/user/${email}`,
    OFFICER: (email) => `/api/complaints/officer/${email}`,
    ANALYTICS: '/api/analytics/complaints',
  },
  ADMIN: {
    DEPARTMENTS: '/api/admin/departments',
    OFFICERS: '/api/admin/officers',
    WARDS: '/api/admin/wards',
    DASHBOARD: '/api/admin/dashboard/summary',
  },
}

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  CITIZEN: {
    DASHBOARD: '/citizen/dashboard',
    SUBMIT_COMPLAINT: '/citizen/submit',
    MY_COMPLAINTS: '/citizen/complaints',
    COMPLAINT_DETAIL: (id) => `/citizen/complaints/${id}`,
  },
  OFFICER: {
    DASHBOARD: '/officer/dashboard',
    QUEUE: '/officer/queue',
    COMPLAINT_DETAIL: (id) => `/officer/complaints/${id}`,
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    DEPARTMENTS: '/admin/departments',
    OFFICERS: '/admin/officers',
    WARDS: '/admin/wards',
    ANALYTICS: '/admin/analytics',
  },
}

/**
 * UI constants
 */
export const UI = {
  TOAST_DURATION: 3000,
  PAGINATION_LIMIT: 10,
  DEBOUNCE_DELAY: 300,
}

/**
 * Validation rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^[0-9]{10,}$/,
  TITLE_MIN_LENGTH: 3,
  DESCRIPTION_MIN_LENGTH: 10,
}

/**
 * Error messages
 */
export const ERRORS = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  REQUIRED_FIELD: 'This field is required.',
}

/**
 * Success messages
 */
export const SUCCESS = {
  LOGIN: 'Logged in successfully.',
  REGISTER: 'Registered successfully. Welcome!',
  COMPLAINT_SUBMITTED: 'Complaint submitted successfully.',
  COMPLAINT_UPDATED: 'Complaint updated successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
}
