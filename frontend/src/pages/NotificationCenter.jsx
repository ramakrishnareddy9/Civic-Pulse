import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'alert',
    icon: 'warning',
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
    title: 'Urgent: Water Main Break in Sector 7',
    time: '2 min ago',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    desc: 'Immediate action required. Dispatch repair crew and notify residents within a 2-block radius of the intersection.',
    unread: true,
    category: 'alert',
    priority: 'CRITICAL',
    link: '/officer/dashboard',
  },
  {
    id: 2,
    type: 'assignment',
    icon: 'assignment_ind',
    iconColor: '#1e40af',
    iconBg: '#dbeafe',
    title: 'New Complaint Assigned: #CP-9821',
    time: '15 min ago',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    desc: 'Citizen reports illegal dumping near the Central Park trailhead. Assigned to your queue by the system.',
    unread: true,
    category: 'assignment',
    priority: 'HIGH',
    link: '/officer/dashboard',
  },
  {
    id: 3,
    type: 'update',
    icon: 'update',
    iconColor: '#059669',
    iconBg: '#d1fae5',
    title: 'Case #CP-9822 Status Changed to Resolved',
    time: '3 hr ago',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    desc: "The status of 'Public Lighting Malfunction' has been moved from In Progress to Resolved.",
    unread: false,
    category: 'update',
    link: '/citizen/complaints/9822',
  },
  {
    id: 4,
    type: 'system',
    icon: 'campaign',
    iconColor: '#7c3aed',
    iconBg: '#ede9fe',
    title: 'System Maintenance Scheduled',
    time: '5 hr ago',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    desc: 'The CivicPulse portal will be undergoing scheduled maintenance on June 1, 2026 from 2:00 AM to 4:00 AM IST.',
    unread: false,
    category: 'system',
  },
  {
    id: 5,
    type: 'assignment',
    icon: 'assignment_turned_in',
    iconColor: '#1e40af',
    iconBg: '#dbeafe',
    title: 'Complaint #CP-9815 Claimed by Officer',
    time: '1 day ago',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    desc: 'Your complaint about the street light outage on Oak Lane has been picked up by Officer Smith and is now in progress.',
    unread: false,
    category: 'update',
    link: '/citizen/complaints/9815',
  },
  {
    id: 6,
    type: 'alert',
    icon: 'emergency',
    iconColor: '#b45309',
    iconBg: '#fef3c7',
    title: 'SLA Warning: Case #CP-9819 Approaching Deadline',
    time: '2 days ago',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    desc: 'The SLA deadline for the Pothole Hazard case on Ring Road is approaching in 4 hours. Please take action.',
    unread: false,
    category: 'alert',
    priority: 'HIGH',
    link: '/officer/complaints/9819',
  },
]

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', icon: 'inbox' },
  { key: 'alert', label: 'Alerts', icon: 'warning' },
  { key: 'assignment', label: 'Assignments', icon: 'assignment_ind' },
  { key: 'update', label: 'Updates', icon: 'update' },
  { key: 'system', label: 'System', icon: 'campaign' },
]

function timeAgo(timestamp) {
  const now = new Date()
  const diff = now - timestamp
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = notifications.filter(n => {
    if (activeCategory !== 'all' && n.category !== activeCategory) return false
    if (showUnreadOnly && !n.unread) return false
    return true
  })

  const unreadCount = notifications.filter(n => n.unread).length

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const priorityBadge = {
    CRITICAL: { label: 'Critical', bg: '#fee2e2', color: '#991b1b' },
    HIGH: { label: 'High', bg: '#ffedd5', color: '#9a3412' },
  }

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
                'All notifications read. You\'re up to date!'
              )}
            </p>
          </div>
          <div className="flex gap-3">
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
          </div>
        </div>

        {/* Filters */}
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

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: 'var(--gov-border)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(10,35,66,0.06)' }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--gov-text-light)' }}>notifications_off</span>
            </div>
            <p className="font-bold text-base mb-1" style={{ color: 'var(--gov-navy)' }}>No Notifications</p>
            <p className="text-sm text-gray-500">
              {showUnreadOnly ? 'No unread notifications in this category.' : 'No notifications in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(notification => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md group relative ${notification.unread ? 'border-l-4' : ''}`}
                style={{
                  borderColor: notification.unread ? notification.iconColor : 'var(--gov-border)',
                  borderLeftColor: notification.unread ? notification.iconColor : undefined,
                }}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: notification.iconBg }}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: notification.iconColor, fontVariationSettings: "'FILL' 1" }}
                      >
                        {notification.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-bold ${notification.unread ? '' : 'text-gray-700'}`} style={{ color: notification.unread ? 'var(--gov-navy)' : undefined }}>
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: notification.iconColor }} />
                          )}
                          {notification.priority && priorityBadge[notification.priority] && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: priorityBadge[notification.priority].bg, color: priorityBadge[notification.priority].color }}
                            >
                              {priorityBadge[notification.priority].label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notification.timestamp)}</span>
                          {/* Actions (hover) */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notification.unread && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                title="Mark as read"
                              >
                                <span className="material-symbols-outlined text-sm text-gray-400">done</span>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-sm text-gray-400 hover:text-red-500">close</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{notification.desc}</p>

                      {/* CTA */}
                      {notification.link && (
                        <button
                          onClick={() => {
                            markAsRead(notification.id)
                            navigate(notification.link)
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold hover:underline transition-colors"
                          style={{ color: notification.iconColor }}
                        >
                          View Details
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom info */}
        <div
          className="mt-8 rounded-2xl border p-4 text-center"
          style={{ background: 'white', borderColor: 'var(--gov-border)' }}
        >
          <p className="text-xs text-gray-400">
            Notifications are retained for 30 days · <button className="underline hover:text-gray-600">Manage preferences</button>
          </p>
        </div>
      </div>
    </div>
  )
}
