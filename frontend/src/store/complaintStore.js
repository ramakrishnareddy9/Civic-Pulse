import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Complaint store for managing complaints list and detail state
 * @type {import('zustand').UseBoundStore<ComplaintState>}
 */
export const useComplaintStore = create(
  devtools((set, get) => ({
    complaints: [],
    currentComplaint: null,
    loading: false,
    error: null,
    pagination: null,
    filters: {
      status: null,
      category: null,
      wardId: null,
      page: 0,
      limit: 10,
    },

    /**
     * Set complaints list
     * @param {Complaint[]} complaints - Complaints array
     */
    setComplaints: (complaints) => {
      set({ complaints }, false, 'setComplaints')
    },

    /**
     * Add complaint to list
     * @param {Complaint} complaint - New complaint
     */
    addComplaint: (complaint) => {
      const { complaints } = get()
      set({ complaints: [complaint, ...complaints] }, false, 'addComplaint')
    },

    /**
     * Update complaint in list
     * @param {number} id - Complaint ID
     * @param {Partial<Complaint>} updates - Updated fields
     */
    updateComplaint: (id, updates) => {
      const { complaints } = get()
      const updated = complaints.map((c) => (c.id === id ? { ...c, ...updates } : c))
      set({ complaints: updated }, false, 'updateComplaint')
    },

    /**
     * Remove complaint from list
     * @param {number} id - Complaint ID
     */
    removeComplaint: (id) => {
      const { complaints } = get()
      set({ complaints: complaints.filter((c) => c.id !== id) }, false, 'removeComplaint')
    },

    /**
     * Set current complaint detail
     * @param {Complaint | null} complaint - Current complaint
     */
    setCurrentComplaint: (complaint) => {
      set({ currentComplaint: complaint, error: null }, false, 'setCurrentComplaint')
    },

    /**
     * Clear current complaint
     */
    clearCurrentComplaint: () => {
      set({ currentComplaint: null }, false, 'clearCurrentComplaint')
    },

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading: (loading) => {
      set({ loading }, false, 'setLoading')
    },

    /**
     * Set error message
     * @param {string | null} error - Error message
     */
    setError: (error) => {
      set({ error }, false, 'setError')
    },

    /**
     * Clear error message
     */
    clearError: () => {
      set({ error: null }, false, 'clearError')
    },

    /**
     * Set pagination info
     * @param {PaginatedResponse} pagination - Pagination object
     */
    setPagination: (pagination) => {
      set({ pagination }, false, 'setPagination')
    },

    /**
     * Update filters
     * @param {Partial<ComplaintFilter>} updates - Filter updates
     */
    setFilters: (updates) => {
      const { filters } = get()
      set({ filters: { ...filters, ...updates } }, false, 'setFilters')
    },

    /**
     * Reset filters to defaults
     */
    resetFilters: () => {
      set(
        {
          filters: {
            status: null,
            category: null,
            wardId: null,
            page: 0,
            limit: 10,
          },
        },
        false,
        'resetFilters'
      )
    },

    /**
     * Reset all state
     */
    reset: () => {
      set(
        {
          complaints: [],
          currentComplaint: null,
          loading: false,
          error: null,
          pagination: null,
          filters: {
            status: null,
            category: null,
            wardId: null,
            page: 0,
            limit: 10,
          },
        },
        false,
        'reset'
      )
    },
  }), { name: 'complaint-store' })
)
