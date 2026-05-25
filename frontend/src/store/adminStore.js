import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Admin store for managing admin-specific state
 */
export const useAdminStore = create(
  devtools((set, get) => ({
    departments: [],
    officers: [],
    wards: [],
    dashboardData: null,
    loading: false,
    error: null,

    /**
     * Set departments list
     * @param {Department[]} departments - Departments array
     */
    setDepartments: (departments) => {
      set({ departments }, false, 'setDepartments')
    },

    /**
     * Add department
     * @param {Department} department - New department
     */
    addDepartment: (department) => {
      const { departments } = get()
      set({ departments: [...departments, department] }, false, 'addDepartment')
    },

    /**
     * Update department
     * @param {number} id - Department ID
     * @param {Partial<Department>} updates - Updated fields
     */
    updateDepartment: (id, updates) => {
      const { departments } = get()
      const updated = departments.map((d) => (d.id === id ? { ...d, ...updates } : d))
      set({ departments: updated }, false, 'updateDepartment')
    },

    /**
     * Remove department
     * @param {number} id - Department ID
     */
    removeDepartment: (id) => {
      const { departments } = get()
      set({ departments: departments.filter((d) => d.id !== id) }, false, 'removeDepartment')
    },

    /**
     * Set officers list
     * @param {Officer[]} officers - Officers array
     */
    setOfficers: (officers) => {
      set({ officers }, false, 'setOfficers')
    },

    /**
     * Add officer
     * @param {Officer} officer - New officer
     */
    addOfficer: (officer) => {
      const { officers } = get()
      set({ officers: [...officers, officer] }, false, 'addOfficer')
    },

    /**
     * Update officer
     * @param {number} id - Officer ID
     * @param {Partial<Officer>} updates - Updated fields
     */
    updateOfficer: (id, updates) => {
      const { officers } = get()
      const updated = officers.map((o) => (o.id === id ? { ...o, ...updates } : o))
      set({ officers: updated }, false, 'updateOfficer')
    },

    /**
     * Remove officer
     * @param {number} id - Officer ID
     */
    removeOfficer: (id) => {
      const { officers } = get()
      set({ officers: officers.filter((o) => o.id !== id) }, false, 'removeOfficer')
    },

    /**
     * Set wards list
     * @param {Ward[]} wards - Wards array
     */
    setWards: (wards) => {
      set({ wards }, false, 'setWards')
    },

    /**
     * Add ward
     * @param {Ward} ward - New ward
     */
    addWard: (ward) => {
      const { wards } = get()
      set({ wards: [...wards, ward] }, false, 'addWard')
    },

    /**
     * Update ward
     * @param {number} id - Ward ID
     * @param {Partial<Ward>} updates - Updated fields
     */
    updateWard: (id, updates) => {
      const { wards } = get()
      const updated = wards.map((w) => (w.id === id ? { ...w, ...updates } : w))
      set({ wards: updated }, false, 'updateWard')
    },

    /**
     * Remove ward
     * @param {number} id - Ward ID
     */
    removeWard: (id) => {
      const { wards } = get()
      set({ wards: wards.filter((w) => w.id !== id) }, false, 'removeWard')
    },

    /**
     * Set dashboard data
     * @param {*} data - Dashboard data
     */
    setDashboardData: (data) => {
      set({ dashboardData: data }, false, 'setDashboardData')
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
     * Reset all state
     */
    reset: () => {
      set(
        {
          departments: [],
          officers: [],
          wards: [],
          dashboardData: null,
          loading: false,
          error: null,
        },
        false,
        'reset'
      )
    },
  }), { name: 'admin-store' })
)
