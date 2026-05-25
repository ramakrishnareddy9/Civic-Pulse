import { get, post, put, del, postFormData } from './client'

/**
 * Fetch all complaints with filters
 * @param {ComplaintFilter} filters - Filter options
 * @returns {Promise<PaginatedResponse<Complaint[]>>}
 */
export const fetchComplaints = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.category) params.append('category', filters.category)
  if (filters.wardId) params.append('wardId', filters.wardId)
  if (filters.page !== undefined) params.append('page', filters.page)
  if (filters.limit !== undefined) params.append('limit', filters.limit)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.order) params.append('order', filters.order)

  const queryString = params.toString()
  const url = queryString ? `/api/complaints?${queryString}` : '/api/complaints'
  return get(url)
}

/**
 * Fetch single complaint by ID
 * @param {number} complaintId - Complaint ID
 * @returns {Promise<Complaint>}
 */
export const fetchComplaint = async (complaintId) => {
  return get(`/api/complaints/${complaintId}`)
}

/**
 * Fetch complaints by user
 * @param {string} userEmail - User email
 * @param {number} [page=0] - Page number
 * @param {number} [limit=10] - Page limit
 * @returns {Promise<PaginatedResponse<Complaint[]>>}
 */
export const fetchUserComplaints = async (userEmail, page = 0, limit = 10) => {
  return get(`/api/complaints/user/${userEmail}?page=${page}&limit=${limit}`)
}

/**
 * Fetch complaints for officer queue
 * @param {string} officerEmail - Officer email
 * @param {number} [page=0] - Page number
 * @param {number} [limit=10] - Page limit
 * @returns {Promise<PaginatedResponse<Complaint[]>>}
 */
export const fetchOfficerQueue = async (officerEmail, page = 0, limit = 10) => {
  return get(`/api/complaints/officer/${officerEmail}?page=${page}&limit=${limit}`)
}

/**
 * Submit new complaint
 * @param {Object} complaintData - Complaint data
 * @param {string} complaintData.title - Complaint title
 * @param {string} complaintData.description - Complaint description
 * @param {string} complaintData.location - Location/address
 * @param {number} [complaintData.wardId] - Ward ID
 * @param {File[]} [images] - Image files
 * @returns {Promise<Complaint>}
 */
export const submitComplaint = async (complaintData, images = []) => {
  const formData = new FormData()
  formData.append(
    'complaint',
    new Blob(
      [
        JSON.stringify({
          title: complaintData.title,
          description: complaintData.description,
          location: complaintData.location,
          wardId: complaintData.wardId,
        }),
      ],
      { type: 'application/json' }
    )
  )

  images.forEach((image, index) => {
    formData.append(`images`, image)
  })

  return postFormData('/api/complaints/submit', formData)
}

/**
 * Update complaint status
 * @param {number} complaintId - Complaint ID
 * @param {string} newStatus - New status
 * @param {string} [notes] - Status update notes
 * @returns {Promise<Complaint>}
 */
export const updateComplaintStatus = async (complaintId, newStatus, notes = '') => {
  return put(`/api/complaints/${complaintId}/status`, {
    status: newStatus,
    notes,
  })
}

/**
 * Delete complaint (soft delete)
 * @param {number} complaintId - Complaint ID
 * @returns {Promise<void>}
 */
export const deleteComplaint = async (complaintId) => {
  return del(`/api/complaints/${complaintId}`)
}

/**
 * Get AI insights for complaint
 * @param {number} complaintId - Complaint ID
 * @returns {Promise<Object>}
 */
export const getComplaintInsights = async (complaintId) => {
  return get(`/api/complaints/${complaintId}/insights`)
}

/**
 * Get complaint analytics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export const getComplaintAnalytics = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.wardId) params.append('wardId', filters.wardId)
  if (filters.departmentId) params.append('departmentId', filters.departmentId)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)

  const queryString = params.toString()
  const url = queryString ? `/api/analytics/complaints?${queryString}` : '/api/analytics/complaints'
  return get(url)
}

/**
 * Get SLA information for complaint
 * @param {number} complaintId - Complaint ID
 * @returns {Promise<Object>}
 */
export const getComplaintSla = async (complaintId) => {
  return get(`/api/complaints/${complaintId}/sla`)
}
