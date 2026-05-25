import { useEffect, useRef, useCallback } from 'react'
import SockJS from 'sockjs-client'
import { over } from '@stomp/stompjs'
import { useAuthStore } from '@store/authStore'

/**
 * Custom hook for WebSocket connections with STOMP protocol
 * @param {string} [destinationPrefix] - Destination prefix for subscriptions
 * @returns {Object} WebSocket methods and state
 */
export const useWebSocket = (destinationPrefix = '') => {
  const stompClientRef = useRef(null)
  const subscriptionsRef = useRef(new Map())
  const { token } = useAuthStore()

  /**
   * Connect to WebSocket
   * @returns {Promise<void>}
   */
  const connect = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (stompClientRef.current?.connected) {
        resolve()
        return
      }

      try {
        const socket = new SockJS('/ws')
        const stompClient = over(socket)

        stompClient.connect(
          {
            'X-Authorization': `Bearer ${token}`,
          },
          () => {
            stompClientRef.current = stompClient
            resolve()
          },
          (error) => {
            console.error('WebSocket connection error:', error)
            reject(error)
          }
        )
      } catch (error) {
        reject(error)
      }
    })
  }, [token])

  /**
   * Subscribe to a destination
   * @param {string} destination - Subscription destination
   * @param {Function} callback - Message callback
   * @returns {Function} Unsubscribe function
   */
  const subscribe = useCallback(
    (destination, callback) => {
      if (!stompClientRef.current?.connected) {
        console.error('WebSocket not connected')
        return () => {}
      }

      const fullDestination = destinationPrefix
        ? `${destinationPrefix}${destination}`
        : destination

      const subscription = stompClientRef.current.subscribe(fullDestination, (message) => {
        try {
          const body = JSON.parse(message.body)
          callback(body)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          callback(message.body)
        }
      })

      subscriptionsRef.current.set(fullDestination, subscription)

      return () => {
        subscription.unsubscribe()
        subscriptionsRef.current.delete(fullDestination)
      }
    },
    [destinationPrefix]
  )

  /**
   * Send message to destination
   * @param {string} destination - Send destination
   * @param {*} body - Message body
   */
  const send = useCallback((destination, body) => {
    if (!stompClientRef.current?.connected) {
      console.error('WebSocket not connected')
      return
    }

    const fullDestination = destinationPrefix ? `${destinationPrefix}${destination}` : destination

    stompClientRef.current.send(fullDestination, {}, JSON.stringify(body))
  }, [destinationPrefix])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (stompClientRef.current?.connected) {
      // Unsubscribe from all subscriptions
      subscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe()
      })
      subscriptionsRef.current.clear()

      // Disconnect
      stompClientRef.current.disconnect(() => {
        stompClientRef.current = null
      })
    }
  }, [])

  /**
   * Check if connected
   * @returns {boolean}
   */
  const isConnected = useCallback(() => {
    return stompClientRef.current?.connected || false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    subscribe,
    send,
    disconnect,
    isConnected,
  }
}

/**
 * Hook for real-time complaint updates
 * @param {number} complaintId - Complaint ID
 * @param {Function} [onUpdate] - Update callback
 * @returns {Object} Status and methods
 */
export const useComplaintUpdates = (complaintId, onUpdate) => {
  const { connect, subscribe, disconnect, isConnected } = useWebSocket('/topic/')

  useEffect(() => {
    if (!complaintId) return

    const setupSubscription = async () => {
      try {
        await connect()
        const unsubscribe = subscribe(`complaint/${complaintId}`, (update) => {
          onUpdate?.(update)
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to subscribe to complaint updates:', error)
      }
    }

    let unsubscribe
    setupSubscription().then((fn) => {
      unsubscribe = fn
    })

    return () => {
      unsubscribe?.()
      disconnect()
    }
  }, [complaintId, connect, subscribe, disconnect, onUpdate])

  return { isConnected: isConnected() }
}

/**
 * Hook for real-time notifications
 * @param {string} userId - User ID
 * @param {Function} [onNotification] - Notification callback
 * @returns {Object} Status and methods
 */
export const useNotifications = (userId, onNotification) => {
  const { connect, subscribe, disconnect, isConnected } = useWebSocket('/topic/')

  useEffect(() => {
    if (!userId) return

    const setupSubscription = async () => {
      try {
        await connect()
        const unsubscribe = subscribe(`notifications/${userId}`, (notification) => {
          onNotification?.(notification)
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to subscribe to notifications:', error)
      }
    }

    let unsubscribe
    setupSubscription().then((fn) => {
      unsubscribe = fn
    })

    return () => {
      unsubscribe?.()
      disconnect()
    }
  }, [userId, connect, subscribe, disconnect, onNotification])

  return { isConnected: isConnected() }
}

/**
 * Hook for real-time analytics updates
 * @param {Function} [onUpdate] - Update callback
 * @returns {Object} Status and methods
 */
export const useAnalyticsUpdates = (onUpdate) => {
  const { connect, subscribe, disconnect, isConnected } = useWebSocket('/topic/')

  useEffect(() => {
    const setupSubscription = async () => {
      try {
        await connect()
        const unsubscribe = subscribe('analytics/live', (update) => {
          onUpdate?.(update)
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to subscribe to analytics updates:', error)
      }
    }

    let unsubscribe
    setupSubscription().then((fn) => {
      unsubscribe = fn
    })

    return () => {
      unsubscribe?.()
      disconnect()
    }
  }, [connect, subscribe, disconnect, onUpdate])

  return { isConnected: isConnected() }
}
