/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} email - User email
 * @property {string} fullName - Full name
 * @property {string} role - User role (CITIZEN, OFFICER, ADMIN)
 */

/**
 * @typedef {Object} Complaint
 * @property {number} id - Complaint ID
 * @property {string} title - Complaint title
 * @property {string} description - Complaint description
 * @property {string} status - Status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
 * @property {string} category - Category (ROAD, WATER, ELECTRICITY, OTHER)
 * @property {number} priority - Priority level (0-100)
 * @property {string} citizenId - Citizen ID
 * @property {number} wardId - Ward ID
 * @property {number} departmentId - Department ID
 * @property {string} location - Location/address
 * @property {string[]} images - Image URLs
 * @property {number} sentimentScore - Sentiment score (0-100)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Date} slaDueDate - SLA deadline
 */

/**
 * @typedef {Object} Officer
 * @property {number} id - Officer ID
 * @property {string} email - Officer email
 * @property {string} fullName - Full name
 * @property {string} designation - Designation
 * @property {number} departmentId - Department ID
 * @property {number} wardId - Ward ID
 * @property {boolean} isActive - Is active
 */

/**
 * @typedef {Object} Department
 * @property {number} id - Department ID
 * @property {string} name - Department name
 * @property {string} description - Description
 */

/**
 * @typedef {Object} Ward
 * @property {number} id - Ward ID
 * @property {string} name - Ward name
 * @property {string} location - Ward location
 * @property {string} area - Area information
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Success status
 * @property {*} data - Response data
 * @property {string} [message] - Response message
 * @property {*} [error] - Error details
 */

/**
 * @typedef {Object} ApiError
 * @property {number} status - HTTP status code
 * @property {string} message - Error message
 * @property {*} [data] - Additional error data
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {*[]} content - Data array
 * @property {number} totalElements - Total count
 * @property {number} totalPages - Total pages
 * @property {number} currentPage - Current page
 * @property {number} pageSize - Page size
 */

/**
 * @typedef {Object} ComplaintFilter
 * @property {string} [status] - Filter by status
 * @property {string} [category] - Filter by category
 * @property {number} [wardId] - Filter by ward
 * @property {number} [page] - Page number
 * @property {number} [limit] - Page limit
 * @property {string} [sortBy] - Sort field
 * @property {string} [order] - Sort order (asc/desc)
 */

/**
 * @typedef {Object} AuthState
 * @property {User | null} user - Current user
 * @property {string | null} token - Auth token
 * @property {boolean} isAuthenticated - Is authenticated
 * @property {boolean} loading - Is loading
 * @property {string | null} error - Error message
 */

/**
 * @typedef {Object} ComplaintState
 * @property {Complaint[]} complaints - Complaints list
 * @property {Complaint | null} currentComplaint - Current complaint detail
 * @property {boolean} loading - Is loading
 * @property {string | null} error - Error message
 * @property {PaginatedResponse | null} pagination - Pagination info
 */

/**
 * @typedef {Object} UiState
 * @property {boolean} sidebarOpen - Sidebar visibility
 * @property {Object | null} modal - Modal state
 * @property {string | null} notification - Notification message
 */

export const ComplaintStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
}

export const ComplaintCategory = {
  ROAD: 'ROAD',
  WATER: 'WATER',
  ELECTRICITY: 'ELECTRICITY',
  SANITATION: 'SANITATION',
  GARBAGE: 'GARBAGE',
  STREET_LIGHT: 'STREET_LIGHT',
  OTHER: 'OTHER'
}

export const UserRole = {
  CITIZEN: 'CITIZEN',
  OFFICER: 'OFFICER',
  ADMIN: 'ADMIN'
}

export const PriorityLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
}
