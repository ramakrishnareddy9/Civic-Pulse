import { useCallback } from 'react'
import { useComplaintStore } from '@store/complaintStore'
import * as complaintService from '@api/complaints'
import { handleApiError } from '@api/client'

/**
 * Custom hook for complaint operations
 * @returns {Object} Complaint methods and state
 */
export const useComplaints = () => {
  const {
    complaints,
    currentComplaint,
    loading,
    error,
    filters,
    pagination,
    setComplaints,
    addComplaint,
    updateComplaint,
    removeComplaint,
    setCurrentComplaint,
    clearCurrentComplaint,
    setLoading,
    setError,
    clearError,
    setPagination,
    setFilters,
    resetFilters,
  } = useComplaintStore()

  /**
   * Fetch complaints with filters
   * @param {Partial<ComplaintFilter>} filterUpdates - Filter updates
   * @returns {Promise<boolean>} Success status
   */
  const fetchComplaints = useCallback(
    async (filterUpdates = {}) => {
      try {
        setLoading(true)
        clearError()

        const mergedFilters = { ...filters, ...filterUpdates }
        setFilters(filterUpdates)

        const data = await complaintService.fetchComplaints(mergedFilters)
        // Handle both array responses (mocks) and Spring Page format { content: [] }
        const complaintsArray = Array.isArray(data) ? data : (data?.content || [])
        setComplaints(complaintsArray)
        // Only set pagination if we have page-like data structure
        if (data?.content !== undefined) {
          setPagination(data)
        }

        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [filters, setLoading, clearError, setFilters, setComplaints, setPagination, setError]
  )

  /**
   * Fetch single complaint detail
   * @param {number} complaintId - Complaint ID
   * @returns {Promise<boolean>} Success status
   */
  const fetchDetail = useCallback(
    async (complaintId) => {
      try {
        setLoading(true)
        clearError()

        const complaint = await complaintService.fetchComplaint(complaintId)
        setCurrentComplaint(complaint)

        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, setCurrentComplaint, setError]
  )

  /**
   * Submit new complaint
   * @param {Object} complaintData - Complaint data
   * @param {File[]} [images] - Image files
   * @returns {Promise<Complaint | null>} Created complaint or null
   */
  const submit = useCallback(
    async (complaintData, images = []) => {
      try {
        setLoading(true)
        clearError()

        const complaint = await complaintService.submitComplaint(complaintData, images)
        addComplaint(complaint)

        return complaint
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, addComplaint, setError]
  )

  /**
   * Update complaint status
   * @param {number} complaintId - Complaint ID
   * @param {string} newStatus - New status
   * @param {string} [notes] - Status notes
   * @returns {Promise<boolean>} Success status
   */
  const updateStatus = useCallback(
    async (complaintId, newStatus, notes = '') => {
      try {
        setLoading(true)
        clearError()

        const updated = await complaintService.updateComplaintStatus(complaintId, newStatus, notes)
        updateComplaint(complaintId, {
          status: updated.status,
          updatedAt: updated.updatedAt,
        })

        if (currentComplaint?.id === complaintId) {
          setCurrentComplaint(updated)
        }

        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, updateComplaint, currentComplaint, setCurrentComplaint, setError]
  )

  /**
   * Delete complaint
   * @param {number} complaintId - Complaint ID
   * @returns {Promise<boolean>} Success status
   */
  const deleteComplaint = useCallback(
    async (complaintId) => {
      try {
        setLoading(true)
        clearError()

        await complaintService.deleteComplaint(complaintId)
        removeComplaint(complaintId)

        if (currentComplaint?.id === complaintId) {
          clearCurrentComplaint()
        }

        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, removeComplaint, currentComplaint, clearCurrentComplaint, setError]
  )

  /**
   * Fetch complaints by user
   * @param {string} userEmail - User email
   * @param {number} [page=0] - Page number
   * @param {number} [limit=10] - Page limit
   * @returns {Promise<boolean>} Success status
   */
  const fetchByUser = useCallback(
    async (userEmail, page = 0, limit = 10) => {
      try {
        setLoading(true)
        clearError()

        const data = await complaintService.fetchUserComplaints(userEmail, page, limit)
        const complaintsArray = Array.isArray(data) ? data : (data?.content || [])
        setComplaints(complaintsArray)
        if (!Array.isArray(data)) setPagination(data)

        return true
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, setComplaints, setPagination, setError]
  )

  /**
   * Fetch officer queue
   * @param {string} officerEmail - Officer email
   * @param {number} [page=0] - Page number
   * @param {number} [limit=10] - Page limit
   * @returns {Promise<boolean>} Success status
   */
  const fetchOfficerQueue = useCallback(
    async (officerEmail, page = 0, limit = 10) => {
      try {
        setLoading(true)
        clearError()

        const data = await complaintService.fetchOfficerQueue(officerEmail, page, limit)
        const list = Array.isArray(data) ? data : (data?.content || [])
        setComplaints(list)
        if (!Array.isArray(data)) setPagination(data)

        return list
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, setComplaints, setPagination, setError]
  )

  return {
    complaints,
    currentComplaint,
    loading,
    error,
    filters,
    pagination,
    fetchComplaints,
    fetchDetail,
    submit,
    updateStatus,
    deleteComplaint,
    fetchByUser,
    fetchOfficerQueue,
    clearError,
    resetFilters,
    confirmResolution: async (complaintId, rating = null) => {
      try {
        setLoading(true); clearError();
        const updated = await complaintService.confirmComplaint(complaintId, rating)
        if (currentComplaint?.id === complaintId) setCurrentComplaint(updated)
        return true
      } catch (err) {
        const apiError = handleApiError(err); setError(apiError.message); return false
      } finally { setLoading(false) }
    },
    disputeResolution: async (complaintId, reason) => {
      try {
        setLoading(true); clearError();
        const updated = await complaintService.disputeComplaint(complaintId, reason)
        if (currentComplaint?.id === complaintId) setCurrentComplaint(updated)
        return true
      } catch (err) {
        const apiError = handleApiError(err); setError(apiError.message); return false
      } finally { setLoading(false) }
    }
  }
}
