import { useState, useCallback, useEffect, useRef } from 'react'
import { handleApiError } from '@api/client'

/**
 * Generic API hook for any API operation
 * @template T
 * @param {Function} apiFunction - API function to call
 * @param {*} [initialData] - Initial data value
 * @returns {Object} API state and methods
 */
export const useApi = (apiFunction, initialData = null) => {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  // Track component mount to prevent state updates on unmounted components
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   * Execute API call
   * @param {...*} args - Arguments to pass to API function
   * @returns {Promise<*>} API response
   */
  const execute = useCallback(
    async (...args) => {
      try {
        if (!isMountedRef.current) return null

        setLoading(true)
        setError(null)

        const result = await apiFunction(...args)

        if (isMountedRef.current) {
          setData(result)
        }

        return result
      } catch (err) {
        const apiError = handleApiError(err)
        if (isMountedRef.current) {
          setError(apiError)
        }
        throw apiError
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [apiFunction]
  )

  /**
   * Refetch with same arguments
   */
  const refetch = useCallback(async () => {
    return execute()
  }, [execute])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setLoading(false)
  }, [initialData])

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    clearError,
    reset,
    setData,
  }
}

/**
 * Hook for fetch-on-mount pattern
 * @template T
 * @param {Function} apiFunction - API function to call
 * @param {*} dependencies - Dependencies array
 * @param {*} [initialData] - Initial data value
 * @returns {Object} API state
 */
export const useFetch = (apiFunction, dependencies = [], initialData = null) => {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        if (!isMountedRef.current) return

        setLoading(true)
        setError(null)

        const result = await apiFunction()

        if (!cancelled && isMountedRef.current) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          const apiError = handleApiError(err)
          setError(apiError)
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, dependencies)

  return { data, loading, error }
}

/**
 * Hook for mutation pattern (POST, PUT, DELETE)
 * @template T
 * @param {Function} mutationFn - Mutation function
 * @returns {Object} Mutation state and execute method
 */
export const useMutation = (mutationFn) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args) => {
      try {
        if (!isMountedRef.current) return null

        setLoading(true)
        setError(null)

        const result = await mutationFn(...args)

        if (isMountedRef.current) {
          setData(result)
        }

        return result
      } catch (err) {
        const apiError = handleApiError(err)
        if (isMountedRef.current) {
          setError(apiError)
        }
        throw apiError
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [mutationFn]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
