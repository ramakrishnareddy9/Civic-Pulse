import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * UI store for managing UI state (modals, notifications, sidebar)
 * @type {import('zustand').UseBoundStore<UiState>}
 */
export const useUiStore = create(
  devtools((set, get) => ({
    sidebarOpen: true,
    modals: {},
    notifications: [],

    /**
     * Toggle sidebar
     */
    toggleSidebar: () => {
      const { sidebarOpen } = get()
      set({ sidebarOpen: !sidebarOpen }, false, 'toggleSidebar')
    },

    /**
     * Set sidebar state
     * @param {boolean} open - Open state
     */
    setSidebarOpen: (open) => {
      set({ sidebarOpen: open }, false, 'setSidebarOpen')
    },

    /**
     * Open modal
     * @param {string} name - Modal name
     * @param {*} [data] - Modal data/context
     */
    openModal: (name, data) => {
      const { modals } = get()
      set({ modals: { ...modals, [name]: { open: true, data } } }, false, 'openModal')
    },

    /**
     * Close modal
     * @param {string} name - Modal name
     */
    closeModal: (name) => {
      const { modals } = get()
      const updated = { ...modals }
      if (updated[name]) {
        delete updated[name]
      }
      set({ modals: updated }, false, 'closeModal')
    },

    /**
     * Check if modal is open
     * @param {string} name - Modal name
     * @returns {boolean}
     */
    isModalOpen: (name) => {
      const { modals } = get()
      return !!modals[name]?.open
    },

    /**
     * Get modal data
     * @param {string} name - Modal name
     * @returns {*}
     */
    getModalData: (name) => {
      const { modals } = get()
      return modals[name]?.data
    },

    /**
     * Add notification
     * @param {Object} notification - Notification object
     * @param {string} notification.id - Unique ID
     * @param {string} notification.type - Type (success, error, info, warning)
     * @param {string} notification.message - Message
     * @param {number} [notification.duration=3000] - Auto dismiss duration
     */
    addNotification: (notification) => {
      const { notifications } = get()
      const newNotification = {
        ...notification,
        id: notification.id || `notif-${Date.now()}-${Math.random()}`,
        duration: notification.duration || 3000,
      }
      set({ notifications: [...notifications, newNotification] }, false, 'addNotification')

      // Auto dismiss
      if (newNotification.duration > 0) {
        setTimeout(() => {
          get().removeNotification(newNotification.id)
        }, newNotification.duration)
      }
    },

    /**
     * Remove notification
     * @param {string} id - Notification ID
     */
    removeNotification: (id) => {
      const { notifications } = get()
      set(
        { notifications: notifications.filter((n) => n.id !== id) },
        false,
        'removeNotification'
      )
    },

    /**
     * Clear all notifications
     */
    clearNotifications: () => {
      set({ notifications: [] }, false, 'clearNotifications')
    },

    /**
     * Show success notification
     * @param {string} message - Message
     * @param {number} [duration=3000] - Auto dismiss duration
     */
    showSuccess: (message, duration = 3000) => {
      get().addNotification({
        type: 'success',
        message,
        duration,
      })
    },

    /**
     * Show error notification
     * @param {string} message - Message
     * @param {number} [duration=5000] - Auto dismiss duration
     */
    showError: (message, duration = 5000) => {
      get().addNotification({
        type: 'error',
        message,
        duration,
      })
    },

    /**
     * Show info notification
     * @param {string} message - Message
     * @param {number} [duration=3000] - Auto dismiss duration
     */
    showInfo: (message, duration = 3000) => {
      get().addNotification({
        type: 'info',
        message,
        duration,
      })
    },

    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {number} [duration=4000] - Auto dismiss duration
     */
    showWarning: (message, duration = 4000) => {
      get().addNotification({
        type: 'warning',
        message,
        duration,
      })
    },
  }), { name: 'ui-store' })
)
