import { get, post, put, del } from './client'

/**
 * Department Management
 */

/**
 * Fetch all departments
 * @returns {Promise<Department[]>}
 */
export const fetchDepartments = async () => {
  return get('/api/admin/departments')
}

/**
 * Create department
 * @param {Object} deptData - Department data
 * @returns {Promise<Department>}
 */
export const createDepartment = async (deptData) => {
  return post('/api/admin/departments', deptData)
}

/**
 * Update department
 * @param {number} deptId - Department ID
 * @param {Object} deptData - Updated department data
 * @returns {Promise<Department>}
 */
export const updateDepartment = async (deptId, deptData) => {
  return put(`/api/admin/departments/${deptId}`, deptData)
}

/**
 * Delete department
 * @param {number} deptId - Department ID
 * @returns {Promise<void>}
 */
export const deleteDepartment = async (deptId) => {
  return del(`/api/admin/departments/${deptId}`)
}

/**
 * Officer Management
 */

/**
 * Fetch all officers
 * @returns {Promise<Officer[]>}
 */
export const fetchOfficers = async () => {
  return get('/api/admin/officers')
}

/**
 * Fetch officers by department
 * @param {number} deptId - Department ID
 * @returns {Promise<Officer[]>}
 */
export const fetchOfficersByDepartment = async (deptId) => {
  return get(`/api/admin/officers/department/${deptId}`)
}

/**
 * Fetch officers by ward
 * @param {number} wardId - Ward ID
 * @returns {Promise<Officer[]>}
 */
export const fetchOfficersByWard = async (wardId) => {
  return get(`/api/admin/officers/ward/${wardId}`)
}

/**
 * Onboard new officer
 * @param {Object} officerData - Officer data
 * @param {string} officerData.email - Email
 * @param {string} officerData.fullName - Full name
 * @param {string} officerData.password - Password
 * @param {number} officerData.departmentId - Department ID
 * @param {number} officerData.wardId - Ward ID
 * @param {string} officerData.designation - Designation
 * @returns {Promise<Officer>}
 */
export const onboardOfficer = async (officerData) => {
  return post('/api/admin/officers', officerData)
}

/**
 * Reassign officer
 * @param {number} officerId - Officer ID
 * @param {number} wardId - New ward ID
 * @param {number} deptId - New department ID
 * @returns {Promise<Officer>}
 */
export const reassignOfficer = async (officerId, wardId, deptId) => {
  return put(`/api/admin/officers/${officerId}/reassign`, {
    wardId,
    departmentId: deptId,
  })
}

/**
 * Deactivate officer
 * @param {number} officerId - Officer ID
 * @returns {Promise<void>}
 */
export const deactivateOfficer = async (officerId) => {
  return del(`/api/admin/officers/${officerId}`)
}

/**
 * Ward Management
 */

/**
 * Fetch all wards
 * @returns {Promise<Ward[]>}
 */
export const fetchWards = async () => {
  return get('/api/admin/wards')
}

/**
 * Create ward
 * @param {Object} wardData - Ward data
 * @returns {Promise<Ward>}
 */
export const createWard = async (wardData) => {
  return post('/api/admin/wards', wardData)
}

/**
 * Update ward
 * @param {number} wardId - Ward ID
 * @param {Object} wardData - Updated ward data
 * @returns {Promise<Ward>}
 */
export const updateWard = async (wardId, wardData) => {
  return put(`/api/admin/wards/${wardId}`, wardData)
}

/**
 * Delete ward
 * @param {number} wardId - Ward ID
 * @returns {Promise<void>}
 */
export const deleteWard = async (wardId) => {
  return del(`/api/admin/wards/${wardId}`)
}

/**
 * Admin Dashboard & Analytics
 */

/**
 * Get dashboard summary
 * @returns {Promise<Object>}
 */
export const getDashboardSummary = async () => {
  return get('/api/admin/dashboard/summary')
}

/**
 * Get complaints by status
 * @returns {Promise<Object>}
 */
export const getComplaintsByStatus = async () => {
  return get('/api/admin/analytics/complaints-by-status')
}

/**
 * Get SLA compliance report
 * @returns {Promise<Object>}
 */
export const getSlaReport = async () => {
  return get('/api/admin/analytics/sla-compliance')
}

/**
 * Get performance metrics
 * @param {number} [departmentId] - Optional department filter
 * @returns {Promise<Object>}
 */
export const getPerformanceMetrics = async (departmentId) => {
  const url = departmentId
    ? `/api/admin/analytics/performance?departmentId=${departmentId}`
    : '/api/admin/analytics/performance'
  return get(url)
}

/**
 * Export complaints report
 * @param {Object} filters - Filter options
 * @returns {Promise<Blob>}
 */
export const exportComplaintsReport = async (filters = {}) => {
  const params = new URLSearchParams(filters)
  return get(`/api/admin/reports/complaints?${params.toString()}`, {
    responseType: 'blob',
  })
}
