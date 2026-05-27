import { get, patch, del } from './client'

/**
 * Fetch paginated notifications for the current user.
 * @param {number} [page=0] - Page number
 * @param {number} [size=20] - Page size
 * @returns {Promise<{content: Notification[], totalElements: number, ...}>}
 */
export const fetchNotifications = async (page = 0, size = 20) => {
  return get(`/api/notifications?page=${page}&size=${size}`)
}

/**
 * Get the count of unread notifications (used for the badge in the header).
 * @returns {Promise<{count: number}>}
 */
export const fetchUnreadCount = async () => {
  return get('/api/notifications/unread-count')
}

/**
 * Mark a single notification as read.
 * @param {number} id - Notification ID
 * @returns {Promise<Notification>}
 */
export const markNotificationRead = async (id) => {
  return patch(`/api/notifications/${id}/read`, {})
}

/**
 * Mark all notifications as read for the current user.
 * @returns {Promise<{marked: number}>}
 */
export const markAllNotificationsRead = async () => {
  return patch('/api/notifications/read-all', {})
}

/**
 * Delete a notification.
 * @param {number} id - Notification ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (id) => {
  return del(`/api/notifications/${id}`)
}
