import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useNotifications } from '@hooks/useNotifications'

// ─── Category filter config ──────────────────────────────────────────────────
const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', icon: 'inbox' },
  { key: 'ALERT', label: 'Alerts', icon: 'warning' },
  { key: 'ASSIGNMENT', label: 'Assignments', icon: 'assignment_ind' },
  { key: 'STATUS_UPDATE', label: 'Updates', icon: 'update' },
  { key: 'SYSTEM', label: 'System', icon: 'campaign' },
]

// Visual theming per notification type from backend
const TYPE_STYLE = {
  ALERT: { iconColor: '#dc2626', iconBg: '#fee2e2', icon: 'warning' },
  ASSIGNMENT: { iconColor: '#1e40af', iconBg: '#dbeafe', icon: 'assignment_ind' },
  STATUS_UPDATE: { iconColor: '#059669', iconBg: '#d1fae5', icon: 'update' },
  RESOLUTION_CONFIRMED: { iconColor: '#7c3aed', iconBg: '#ede9fe', icon: 'task_alt' },
  RESOLUTION_DISPUTED: { iconColor: '#b45309', iconBg: '#fef3c7', icon: 'report_problem' },
  SYSTEM: { iconColor: '#7c3aed', iconBg: '#ede9fe', icon: 'campaign' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const diff = now - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hr ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, unreadCount, loading, error, markRead, markAllRead, remove, reload } = useNotifications()
  const [activeCategory, setActiveCategory] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = notifications.filter(n => {
    const matchesCategory = activeCategory === 'all' || n.type === activeCategory
    const matchesUnread = !showUnreadOnly || !n.isRead
    return matchesCategory && matchesUnread
  })

  return (
    <div style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--gov-navy)' }}>Notification Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount > 0 ? (
                <span>You have <span className="font-bold" style={{ color: 'var(--gov-navy)' }}>{unreadCount} unread</span> notifications.</span>
              ) : (
                "All notifications read. You're up to date!"
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:shadow-sm"
                style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-navy)', background: 'white' }}
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Mark All Read
              </button>
            )}
            <button
              onClick={reload}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all hover:shadow-sm"
              style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text-muted)', background: 'white' }}
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl border text-sm font-medium" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}>
            <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
            {error}
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveCategory(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all border"
              style={{
                background: activeCategory === f.key ? 'var(--gov-navy)' : 'white',
                color: activeCategory === f.key ? 'white' : 'var(--gov-text-muted)',
                borderColor: activeCategory === f.key ? 'var(--gov-navy)' : 'var(--gov-border)',
              }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              {f.label}
              {f.key === 'all' && notifications.length > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: activeCategory === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(10,35,66,0.08)',
                    color: activeCategory === 'all' ? 'white' : 'var(--gov-navy)',
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all border ml-auto"
            style={{
              background: showUnreadOnly ? '#dbeafe' : 'white',
              color: showUnreadOnly ? '#1e40af' : 'var(--gov-text-muted)',
              borderColor: showUnreadOnly ? '#bfdbfe' : 'var(--gov-border)',
            }}
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Unread Only
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && notifications.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor: 'var(--gov-border)' }}>
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: 'var(--gov-border)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(10,35,66,0.06)' }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--gov-text-light)' }}>notifications_off</span>
            </div>
            <p className="font-bold text-base mb-1" style={{ color: 'var(--gov-navy)' }}>No Notifications</p>
            <p className="text-sm text-gray-500">
              {showUnreadOnly ? 'No unread notifications in this category.' : 'No notifications in this category.'}
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(notification => {
              const style = TYPE_STYLE[notification.type] || TYPE_STYLE.SYSTEM
              const isUnread = !notification.isRead

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-2xl border transition-all hover:shadow-md group relative ${isUnread ? 'border-l-4' : ''}`}
                  style={{
                    borderColor: isUnread ? style.iconColor : 'var(--gov-border)',
                    borderLeftColor: isUnread ? style.iconColor : undefined,
                  }}
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: style.iconBg }}
                      >
                        <span
                          className="material-symbols-outlined text-xl"
                          style={{ color: style.iconColor, fontVariationSettings: "'FILL' 1" }}
                        >
                          {style.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className="text-sm font-bold"
                              style={{ color: isUnread ? 'var(--gov-navy)' : '#374151' }}
                            >
                              {notification.title}
                            </p>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: style.iconColor }} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notification.createdAt)}</span>
                            {/* Actions (visible on hover) */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isUnread && (
                                <button
                                  onClick={() => markRead(notification.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                  title="Mark as read"
                                >
                                  <span className="material-symbols-outlined text-sm text-gray-400">done</span>
                                </button>
                              )}
                              <button
                                onClick={() => remove(notification.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-sm text-gray-400 hover:text-red-500">close</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {notification.body && (
                          <p className="text-sm text-gray-500 leading-relaxed mb-3">{notification.body}</p>
                        )}

                        {/* CTA link */}
                        {notification.link && (
                          <button
                            onClick={() => {
                              markRead(notification.id)
                              navigate(notification.link)
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold hover:underline transition-colors"
                            style={{ color: style.iconColor }}
                          >
                            View Details
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-8 rounded-2xl border p-4 text-center"
          style={{ background: 'white', borderColor: 'var(--gov-border)' }}
        >
          <p className="text-xs text-gray-400">
            Notifications are retained for 30 days · Showing latest {notifications.length}
          </p>
        </div>
      </div>
    </div>
  )
}
