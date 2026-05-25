import { useCallback } from 'react'
import { useUiStore } from '@store/uiStore'

/**
 * Custom hook for notifications
 * @returns {Object} Notification methods
 */
export const useNotification = () => {
  const { showSuccess, showError, showInfo, showWarning, addNotification, removeNotification } =
    useUiStore()

  return {
    success: useCallback((message, duration) => showSuccess(message, duration), [showSuccess]),
    error: useCallback((message, duration) => showError(message, duration), [showError]),
    info: useCallback((message, duration) => showInfo(message, duration), [showInfo]),
    warning: useCallback((message, duration) => showWarning(message, duration), [showWarning]),
    show: useCallback(
      (notification) => addNotification(notification),
      [addNotification]
    ),
    remove: useCallback((id) => removeNotification(id), [removeNotification]),
  }
}
