import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@api/notifications'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

/**
 * Hook for notification state — fetches from the real backend,
 * polls for updates, and exposes actions for marking read / deleting.
 */
export const useNotifications = () => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      const page = await fetchNotifications(0, 50)
      // Spring Page response: { content: [...], ... }
      const items = Array.isArray(page) ? page : (page?.content ?? page?.data?.content ?? [])
      setNotifications(items)
      // Compute unread from fetched items (avoids extra round trip)
      setUnreadCount(items.filter(n => !n.isRead).length)
      setError(null)
    } catch (err) {
      setError(err?.message ?? 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetchUnreadCount()
      const count = res?.count ?? res?.data?.count ?? 0
      setUnreadCount(count)
    } catch (_) {
      // silent — badge is best-effort
    }
  }, [isAuthenticated])

  // Initial load + polling
  useEffect(() => {
    if (!isAuthenticated) return
    loadNotifications()
    pollRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(pollRef.current)
  }, [isAuthenticated, loadNotifications, refreshUnreadCount])

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification read', err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications read', err)
    }
  }, [])

  const remove = useCallback(async (id) => {
    try {
      await deleteNotification(id)
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id)
        if (removed && !removed.isRead) {
          setUnreadCount(c => Math.max(0, c - 1))
        }
        return prev.filter(n => n.id !== id)
      })
    } catch (err) {
      console.error('Failed to delete notification', err)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markRead,
    markAllRead,
    remove,
  }
}
