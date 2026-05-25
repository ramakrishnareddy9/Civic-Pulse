import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Auth store for managing authentication state
 * Persists token to localStorage automatically
 * @type {import('zustand').UseBoundStore<AuthState>}
 */
export const useAuthStore = create(
  persist(
    devtools((set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      /**
       * Set authentication state
       * @param {User} user - User object
       * @param {string} token - Auth token
       */
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, error: null }, false, 'setAuth')
      },

      /**
       * Clear authentication state
       */
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null }, false, 'logout')
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
       * Update user profile
       * @param {Partial<User>} updates - Partial user updates
       */
      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } }, false, 'updateUser')
        }
      },
    }), { name: 'auth-store' }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

/**
 * Get auth store (for access outside React components)
 */
export const getAuthStore = useAuthStore
