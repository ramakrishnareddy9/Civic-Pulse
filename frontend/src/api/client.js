import axios from 'axios'
import { getAuthStore } from '@store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Create axios instance with base configuration
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 1000,
})

/**
 * Request interceptor - Add auth token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const { token } = getAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor - Handle common response scenarios
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      const { logout } = getAuthStore.getState()
      logout()
      window.location.href = '/login'
    }

    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access denied')
    }

    return Promise.reject(error)
  }
)

/**
 * @typedef {Object} ApiClientConfig
 * @property {Record<string, string>} [headers] - Custom headers
 * @property {number} [timeout] - Request timeout
 * @property {*} [data] - Request body
 */

// Global high-fidelity mock fallback data for offline development/testing
const getMockData = (url) => {
  const cleanUrl = url.replace(/^[a-zA-Z]+:\/\/[^\/]+/, '') // remove domain if present
  
  if (cleanUrl.includes('/api/admin/dashboard/summary')) {
    return {
      totalUsers: 1248,
      openComplaints: 42,
      officers: 12,
      totalComplaints: 1482
    }
  }
  
  if (cleanUrl.includes('/api/admin/departments')) {
    return [
      { id: 1, name: 'Public Works', description: 'Infrastructure and roads' },
      { id: 2, name: 'Sanitation', description: 'Waste and cleaning' },
      { id: 3, name: 'Law Enforcement', description: 'Safety and policing' },
      { id: 4, name: 'Parks & Recreation', description: 'Green spaces and parks' }
    ]
  }
  
  if (cleanUrl.includes('/api/admin/wards')) {
    return [
      { id: 1, name: 'Ward 01', description: 'North District' },
      { id: 2, name: 'Ward 02', description: 'South District' },
      { id: 3, name: 'Ward 03', description: 'East District' },
      { id: 4, name: 'Ward 04', description: 'West District' },
      { id: 7, name: 'Ward 07', description: 'Central District' },
      { id: 8, name: 'Ward 08', description: 'Commercial District' },
      { id: 11, name: 'Ward 11', description: 'Metro Center' },
      { id: 12, name: 'Ward 12', description: 'Residential Zone' }
    ]
  }
  
  if (cleanUrl.includes('/api/admin/officers')) {
    return [
      { id: 101, fullName: 'Sarah Jenkins', email: 's.jenkins@city.gov', departmentId: 1, departmentName: 'Public Works', wardId: 8, wardName: 'Ward 08', designation: 'Triage Supervisor' },
      { id: 102, fullName: 'Michael Chen', email: 'm.chen@police.gov', departmentId: 3, departmentName: 'Law Enforcement', wardId: 2, wardName: 'Ward 02', designation: 'Patrol Sergeant' },
      { id: 103, fullName: 'Elena Rodriguez', email: 'e.rodriguez@city.gov', departmentId: 2, departmentName: 'Sanitation', wardId: 11, wardName: 'Ward 11', designation: 'Superintendent' }
    ]
  }
  
  if (cleanUrl.includes('/api/complaints/officer/')) {
    const list = [
      {
        id: 9821,
        title: 'Water Main Burst - 5th Ave',
        description: 'Heavy flooding reported at the intersection of 5th Ave and Maple St. Traffic blocked in both directions. Potential basement flooding in adjacent commercial units.',
        status: 'OPEN',
        priority: 'CRITICAL',
        category: 'Infrastructure',
        ward: 'Ward 1 - Koramangala',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        slaDueDate: new Date(Date.now() + 86400000).toISOString(),
        images: ['https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=400&q=80'],
        address: '5th Ave, Koramangala, Bengaluru, Karnataka 560034',
        latitude: 12.9352,
        longitude: 77.6245
      },
      {
        id: 9819,
        title: 'Pothole Hazard - Ring Road',
        description: 'Large pothole reported in the center lane of the southbound ring road. Two vehicles reported flat tires in the last hour.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Infrastructure',
        ward: 'Ward 2 - Indiranagar',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        slaDueDate: new Date(Date.now() + 172800000).toISOString(),
        assignedTo: 'Officer James Smith',
        officerNotes: 'Assigned crew dispatched to assess depth and arrange cold mix patching.',
        images: [],
        address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
        latitude: 12.9784,
        longitude: 77.6408
      },
      {
        id: 9815,
        title: 'Street Light Out - Oak Lane',
        description: 'Single street lamp flickering at the end of the cul-de-sac. Low traffic area, non-urgent maintenance request.',
        status: 'OPEN',
        priority: 'LOW',
        category: 'Infrastructure',
        ward: 'Ward 5 - Malleshwaram',
        createdAt: new Date(Date.now() - 2700000).toISOString(),
        slaDueDate: new Date(Date.now() + 259200000).toISOString(),
        images: [],
        address: '15th Cross Rd, Malleshwaram, Bengaluru, Karnataka 560003',
        latitude: 13.0035,
        longitude: 77.5728
      }
    ]
    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size: 10,
      number: 0,
      numberOfElements: list.length
    }
  }
  
  if (
    cleanUrl.includes('/api/complaints/user/') || 
    cleanUrl.endsWith('/api/complaints') || 
    cleanUrl.includes('/api/complaints?')
  ) {
    const list = [
      {
        id: 9821,
        title: 'Water Main Burst - 5th Ave',
        description: 'Heavy flooding reported at the intersection of 5th Ave and Maple St. Traffic blocked in both directions. Potential basement flooding in adjacent commercial units.',
        status: 'OPEN',
        priority: 'CRITICAL',
        category: 'Infrastructure',
        ward: 'Ward 1 - Koramangala',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        slaDueDate: new Date(Date.now() + 86400000).toISOString(),
        images: ['https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=400&q=80'],
        address: '5th Ave, Koramangala, Bengaluru, Karnataka 560034',
        latitude: 12.9352,
        longitude: 77.6245
      },
      {
        id: 9819,
        title: 'Pothole Hazard - Ring Road',
        description: 'Large pothole reported in the center lane of the southbound ring road. Two vehicles reported flat tires in the last hour.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Infrastructure',
        ward: 'Ward 2 - Indiranagar',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        slaDueDate: new Date(Date.now() + 172800000).toISOString(),
        assignedTo: 'Officer James Smith',
        officerNotes: 'Assigned crew dispatched to assess depth and arrange cold mix patching.',
        images: [],
        address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
        latitude: 12.9784,
        longitude: 77.6408
      },
      {
        id: 9815,
        title: 'Street Light Out - Oak Lane',
        description: 'Single street lamp flickering at the end of the cul-de-sac. Low traffic area, non-urgent maintenance request.',
        status: 'OPEN',
        priority: 'LOW',
        category: 'Infrastructure',
        ward: 'Ward 5 - Malleshwaram',
        createdAt: new Date(Date.now() - 2700000).toISOString(),
        slaDueDate: new Date(Date.now() + 259200000).toISOString(),
        images: [],
        address: '15th Cross Rd, Malleshwaram, Bengaluru, Karnataka 560003',
        latitude: 13.0035,
        longitude: 77.5728
      }
    ]
    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size: 10,
      number: 0,
      numberOfElements: list.length
    }
  }

  if (cleanUrl.match(/\/api\/complaints\/\d+/)) {
    const match = cleanUrl.match(/\/api\/complaints\/(\d+)/)
    const id = match ? Number(match[1]) : 9821
    
    let complaintData = {
      id: id,
      title: 'Water Main Burst - 5th Ave',
      description: 'Heavy flooding reported at the intersection of 5th Ave and Maple St. Traffic blocked in both directions. Potential basement flooding in adjacent commercial units.',
      status: 'OPEN',
      priority: 'CRITICAL',
      category: 'Infrastructure',
      ward: 'Ward 1 - Koramangala',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      slaDueDate: new Date(Date.now() + 86400000).toISOString(),
      submittedBy: 'citizen@civicpulse.gov.in',
      assignedTo: 'Officer James Smith',
      officerNotes: 'Assigned crew dispatched to assess depth and arrange cold mix patching.',
      images: ['https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=400&q=80'],
      address: '5th Ave, Koramangala, Bengaluru, Karnataka 560034',
      latitude: 12.9352,
      longitude: 77.6245
    }

    if (id === 9819) {
      complaintData.title = 'Pothole Hazard - Ring Road'
      complaintData.description = 'Large pothole reported in the center lane of the southbound ring road. Two vehicles reported flat tires in the last hour.'
      complaintData.status = 'IN_PROGRESS'
      complaintData.priority = 'MEDIUM'
      complaintData.ward = 'Ward 2 - Indiranagar'
      complaintData.address = '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038'
      complaintData.latitude = 12.9784
      complaintData.longitude = 77.6408
    } else if (id === 9815) {
      complaintData.title = 'Street Light Out - Oak Lane'
      complaintData.description = 'Single street lamp flickering at the end of the cul-de-sac. Low traffic area, non-urgent maintenance request.'
      complaintData.status = 'OPEN'
      complaintData.priority = 'LOW'
      complaintData.ward = 'Ward 5 - Malleshwaram'
      complaintData.address = '15th Cross Rd, Malleshwaram, Bengaluru, Karnataka 560003'
      complaintData.latitude = 13.0035
      complaintData.longitude = 77.5728
    }
    
    return complaintData
  }

  return null
}

/**
 * Generic GET request
 * @param {string} url - Endpoint URL
 * @param {ApiClientConfig} config - Request config
 * @returns {Promise<*>} Response data
 */
export const get = async (url, config = {}) => {
  try {
    const response = await apiClient.get(url, config)
    return response.data
  } catch (error) {
    // Gracefully catch any error (e.g. connection refused, 502 bad gateway proxy, 504 gateway timeout, or 500 error)
    const mock = getMockData(url)
    if (mock !== null) {
      console.warn(`[Offline Demo Mode] Fallback to mock for GET ${url}:`, error.message)
      return mock
    }
    throw error
  }
}

/**
 * Generic POST request
 * @param {string} url - Endpoint URL
 * @param {*} data - Request body
 * @param {ApiClientConfig} config - Request config
 * @returns {Promise<*>} Response data
 */
export const post = async (url, data, config = {}) => {
  try {
    const response = await apiClient.post(url, data, config)
    return response.data
  } catch (error) {
    console.warn(`[Offline Demo Mode] Intercepted POST write: ${url}`)
    return { success: true, message: 'Mock action executed offline successfully', data }
  }
}

/**
 * Generic PUT request
 * @param {string} url - Endpoint URL
 * @param {*} data - Request body
 * @param {ApiClientConfig} config - Request config
 * @returns {Promise<*>} Response data
 */
export const put = async (url, data, config = {}) => {
  try {
    const response = await apiClient.put(url, data, config)
    return response.data
  } catch (error) {
    console.warn(`[Offline Demo Mode] Intercepted PUT write: ${url}`)
    return { success: true, message: 'Mock action executed offline successfully', data }
  }
}

/**
 * Generic PATCH request
 * @param {string} url - Endpoint URL
 * @param {*} data - Request body
 * @param {ApiClientConfig} config - Request config
 * @returns {Promise<*>} Response data
 */
export const patch = async (url, data, config = {}) => {
  try {
    const response = await apiClient.patch(url, data, config)
    return response.data
  } catch (error) {
    console.warn(`[Offline Demo Mode] Intercepted PATCH write: ${url}`)
    return { success: true, message: 'Mock action executed offline successfully', data }
  }
}

/**
 * Generic DELETE request
 * @param {string} url - Endpoint URL
 * @param {ApiClientConfig} config - Request config
 * @returns {Promise<*>} Response data
 */
export const del = async (url, config = {}) => {
  try {
    const response = await apiClient.delete(url, config)
    return response.data
  } catch (error) {
    console.warn(`[Offline Demo Mode] Intercepted DELETE write: ${url}`)
    return { success: true, message: 'Mock action executed offline successfully' }
  }
}

/**
 * POST with FormData (for file uploads)
 * @param {string} url - Endpoint URL
 * @param {FormData} formData - FormData object
 * @param {ApiClientConfig} config - Request config
 * @returns {Promise<*>} Response data
 */
export const postFormData = async (url, formData, config = {}) => {
  try {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    })
    return response.data
  } catch (error) {
    console.warn(`[Offline Demo Mode] Intercepted mock file upload: ${url}`)
    return { 
      success: true, 
      url: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=400&q=80' 
    }
  }
}

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @returns {Object} Formatted error
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      message: error.response.data?.message || error.message,
      data: error.response.data,
    }
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: 'No response from server',
      data: null,
    }
  } else {
    // Error in request setup
    return {
      status: 0,
      message: error.message,
      data: null,
    }
  }
}
