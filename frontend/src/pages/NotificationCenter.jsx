import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'

export function NotificationCenter() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success } = useNotification()

  // Dynamic state for persistent mock alerts/activities
  const [feed, setFeed] = useState([
    {
      id: 1,
      type: 'alert',
      icon: 'warning',
      iconBg: 'bg-error text-white',
      title: 'Urgent: Water Main Break in Sector 7',
      time: '2 mins ago',
      desc: 'Immediate action required. Dispatch repair crew and notify residents within a 2-block radius of the intersection.',
      unread: true,
      priority: 'High Priority',
      link: '/officer/dashboard'
    },
    {
      id: 2,
      type: 'assignment',
      icon: 'assignment_ind',
      iconBg: 'bg-secondary-container text-on-secondary-container',
      title: 'New Complaint Assigned: #CP-9821',
      time: '15 mins ago',
      desc: 'Citizen reports illegal dumping near the Central Park trailhead. Assigned to your queue by Officer Chen.',
      unread: true,
      link: '/officer/dashboard'
    },
    {
      id: 3,
      type: 'mention',
      icon: 'mention', // represented by user avatar
      title: 'Sarah Mitchell mentioned you',
      time: '1 hour ago',
      desc: '"I\'ve updated the audit logs for the last week. @Officer, can you double-check the Sector 7 entries?"',
      unread: true,
      isMention: true,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3lmKi3M9nGMF9HAAo5GoNlVJSCUm00rp-jTCB2pS7__KY6cuEdoDMOnR-EQmkcQFAhWsPfcJIFYz_RbYJhKNejEBVxlQPnigrEQSmLR16F0D2wHepsEPrPKEyfxJfx7tejtErl1JFQRevoXMlMvcgZ1eLAIJB8HzBQXY6HwudgHC1TQ_DM5uMbLpp5O0BHQr3qDlq9InFTH2TQMypeTrOGIzECiITFI8A7R-9QL1-kKrezYThPKtWX8_J74AEN-x2l0nCTCS_Oq0',
      replyable: true
    },
    {
      id: 4,
      type: 'update',
      icon: 'update',
      iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      title: 'Case #CP-9822 Status Changed',
      time: '3 hours ago',
      desc: 'The status of \'Public Lighting Malfunction\' has been moved from In Progress to Resolved.',
      unread: false,
      link: '/citizen/dashboard'
    },
    {
      id: 5,
      type: 'activity',
      icon: 'description',
      iconBg: 'bg-surface-container-highest text-on-surface-variant',
      title: 'Monthly Analytics Report Ready',
      time: '5 hours ago',
      desc: 'The August performance summary is now available for review in the Department Analytics tab.',
      unread: false,
      link: '/admin/dashboard'
    }
  ])

  const [activeTab, setActiveTab] = useState('all') // 'all', 'unread', 'mentions', 'alerts'
  const [replyInputId, setReplyInputId] = useState(null)
  const [replyText, setReplyText] = useState('')

  const handleMarkAllRead = () => {
    setFeed(prev => prev.map(item => ({ ...item, unread: false })))
    success('All alerts marked as read.')
  }

  const handleMarkIndividualRead = (id) => {
    setFeed(prev => prev.map(item => item.id === id ? { ...item, unread: false } : item))
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    setFeed(prev => prev.filter(item => item.id !== id))
    success('Alert cleared from feed.')
  }

  const handleSendReply = (id) => {
    if (!replyText.trim()) return
    success('Reply sent successfully!')
    setReplyInputId(null)
    setReplyText('')
  }

  // Filter feed based on active tab
  const filteredFeed = feed.filter(item => {
    if (activeTab === 'unread') return item.unread
    if (activeTab === 'mentions') return item.isMention
    if (activeTab === 'alerts') return item.type === 'alert'
    return true
  })

  const counts = {
    all: feed.length,
    unread: feed.filter(item => item.unread).length,
    mentions: feed.filter(item => item.isMention).length,
    alerts: feed.filter(item => item.type === 'alert').length
  }

  const isOfficerOrAdmin = user?.role === 'OFFICER' || user?.role === 'ADMIN'

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-left">
      <div className="flex flex-grow relative">
        
        {/* SHARED COMMAND SIDEBAR Navigation for Officers and Admins */}
        {isOfficerOrAdmin && (
          <aside className="hidden md:flex h-[calc(100vh-64px)] w-72 flex-col bg-surface-container-low border-r border-outline-variant fixed left-0 top-16 p-md gap-sm z-30">
            <div className="flex items-center gap-md p-md mb-md">
              <div className="h-10 w-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined font-bold">shield</span>
              </div>
              <div>
                <h2 className="font-label-lg text-label-lg text-on-surface font-bold">
                  {user?.role === 'ADMIN' ? 'Admin Portal' : 'Officer Portal'}
                </h2>
                <p className="text-xs text-on-surface-variant">Central District</p>
              </div>
            </div>

            <nav className="flex flex-col gap-xs flex-grow">
              <Link 
                to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/officer/dashboard'} 
                className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="font-label-md text-label-md">Dashboard</span>
              </Link>

              {user?.role === 'ADMIN' ? (
                <>
                  <Link 
                    to="/admin/departments" 
                    className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
                  >
                    <span className="material-symbols-outlined">domain</span>
                    <span className="font-label-md text-label-md">Manage Departments</span>
                  </Link>

                  <Link 
                    to="/admin/officers" 
                    className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
                  >
                    <span className="material-symbols-outlined">badge</span>
                    <span className="font-label-md text-label-md">Manage Officers</span>
                  </Link>

                  <Link 
                    to="/admin/wards" 
                    className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
                  >
                    <span className="material-symbols-outlined">map</span>
                    <span className="font-label-md text-label-md">Manage Wards</span>
                  </Link>
                </>
              ) : (
                <Link 
                  to="/officer/dashboard" 
                  className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
                >
                  <span className="material-symbols-outlined">triage</span>
                  <span className="font-label-md text-label-md">Incident Triage Queue</span>
                </Link>
              )}

              <Link 
                to="/notifications" 
                className="flex items-center gap-md px-md py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold transition-all duration-200 shadow-sm"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="font-label-md text-label-md font-bold">Alert Dispatch Center</span>
              </Link>
            </nav>

            <div className="flex flex-col gap-xs pt-md border-t border-outline-variant mt-md">
              <div className="px-md py-xs text-xs text-outline font-bold uppercase">System Health</div>
              <div className="px-md py-sm flex items-center justify-between text-xs text-on-surface-variant">
                <span>Dispatcher Gateway</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </aside>
        )}

        {/* MAIN FEED CANVAS */}
        <main className={`flex-grow ${isOfficerOrAdmin ? 'md:pl-72' : ''} p-md md:p-xl bg-slate-50 min-h-[calc(100vh-64px)]`}>
          <div className="max-w-3xl mx-auto">
            
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
              <div>
                <div className="flex items-center gap-sm text-error mb-xs">
                  <span className="material-symbols-outlined text-[20px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider font-bold">System Alerts Active</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Notification &amp; Alert Center</h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                  Review system updates, dispatcher assignments, and real-time field annotations.
                </p>
              </div>
              
              <button 
                onClick={handleMarkAllRead}
                className="flex items-center gap-sm text-primary hover:bg-primary-container/10 px-md py-sm rounded-lg transition-colors font-label-lg text-label-lg group cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">done_all</span> Mark all as read
              </button>
            </div>

            {/* Metric Tabs Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm mb-lg">
              
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex flex-col items-center justify-center p-md rounded-xl border transition-all shadow-sm cursor-pointer ${activeTab === 'all' ? 'bg-primary border-primary text-white' : 'bg-white border-outline-variant text-on-surface hover:border-primary'}`}
              >
                <span className="font-label-lg text-xs font-bold uppercase tracking-wider">All</span>
                <span className="font-headline-md text-xl font-bold mt-xs">{counts.all}</span>
              </button>

              <button 
                onClick={() => setActiveTab('unread')}
                className={`flex flex-col items-center justify-center p-md rounded-xl border transition-all shadow-sm cursor-pointer ${activeTab === 'unread' ? 'bg-primary border-primary text-white' : 'bg-white border-outline-variant text-on-surface hover:border-primary'}`}
              >
                <span className="font-label-lg text-xs font-bold uppercase tracking-wider">Unread</span>
                <span className="font-headline-md text-xl font-bold mt-xs">{counts.unread}</span>
              </button>

              <button 
                onClick={() => setActiveTab('mentions')}
                className={`flex flex-col items-center justify-center p-md rounded-xl border transition-all shadow-sm cursor-pointer ${activeTab === 'mentions' ? 'bg-primary border-primary text-white' : 'bg-white border-outline-variant text-on-surface hover:border-primary'}`}
              >
                <span className="font-label-lg text-xs font-bold uppercase tracking-wider">Mentions</span>
                <span className="font-headline-md text-xl font-bold mt-xs">{counts.mentions}</span>
              </button>

              <button 
                onClick={() => setActiveTab('alerts')}
                className={`flex flex-col items-center justify-center p-md rounded-xl border transition-all shadow-sm cursor-pointer ${activeTab === 'alerts' ? 'bg-primary border-primary text-white' : 'bg-white border-outline-variant text-on-surface hover:border-primary'}`}
              >
                <span className="font-label-lg text-xs font-bold uppercase tracking-wider">Alerts</span>
                <span className="font-headline-md text-xl font-bold mt-xs">{counts.alerts}</span>
              </button>

            </div>

            {/* RENDERED FEED CARDS WITH ANIMATIONS */}
            <div className="flex flex-col gap-sm">
              <AnimatePresence initial={false}>
                {filteredFeed.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white border border-outline-variant rounded-xl text-on-surface-variant flex flex-col items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-4xl text-outline mb-sm">notifications_off</span>
                    <p className="font-bold text-headline-sm">No notifications found</p>
                    <p className="text-xs text-outline mt-xs">You are completely caught up with all dispatcher events!</p>
                  </motion.div>
                ) : (
                  filteredFeed.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.16 }}
                      onClick={() => handleMarkIndividualRead(item.id)}
                      className={`relative border p-md rounded-xl transition-all flex flex-col gap-md text-left group hover:shadow-md cursor-pointer ${item.unread ? 'bg-white border-primary border-l-4' : 'bg-white/80 border-outline-variant opacity-85'} ${item.type === 'alert' && item.unread ? 'bg-error-container/10 border-error' : ''}`}
                    >
                      <div className="flex gap-md items-start">
                        
                        {/* Icon Backplane */}
                        {item.isMention ? (
                          <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border border-outline-variant">
                            <img className="h-full w-full object-cover" alt="Avatar" src={item.avatar} />
                          </div>
                        ) : (
                          <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-inner ${item.iconBg || 'bg-slate-100 text-primary'}`}>
                            <span className="material-symbols-outlined font-bold text-[20px]">{item.icon}</span>
                          </div>
                        )}

                        {/* Content text */}
                        <div className="flex-grow min-w-0 text-left">
                          <div className="flex justify-between items-start gap-md flex-wrap">
                            <h3 className="font-bold text-primary truncate max-w-sm md:max-w-md">{item.title}</h3>
                            <span className="text-[11px] text-outline font-medium shrink-0">{item.time}</span>
                          </div>
                          
                          <p className="text-xs text-on-surface-variant leading-relaxed mt-sm">
                            {item.desc}
                          </p>

                          {/* Action deep-links or reply options */}
                          <div className="flex items-center gap-md mt-md flex-wrap">
                            {item.link && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(item.link)
                                }}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-xs cursor-pointer bg-transparent border-none p-0"
                              >
                                Access Incident Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}

                            {item.priority && (
                              <span className="bg-error/15 text-error px-sm py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {item.priority}
                              </span>
                            )}

                            {item.replyable && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReplyInputId(replyInputId === item.id ? null : item.id)
                                }}
                                className="bg-slate-100 text-primary px-md py-sm rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer border-none"
                              >
                                {replyInputId === item.id ? 'Cancel Reply' : 'Reply to Comment'}
                              </button>
                            )}
                          </div>

                          {/* Expandable Reply text area */}
                          {replyInputId === item.id && (
                            <div className="mt-md pt-md border-t border-outline-variant/40 flex gap-sm items-start">
                              <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type a reply to team thread..."
                                className="w-full border border-outline-variant focus:border-primary p-md rounded-lg text-xs h-16 resize-none outline-none"
                              />
                              <button 
                                onClick={() => handleSendReply(item.id)}
                                className="p-md bg-primary text-on-primary hover:opacity-90 rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow border-none"
                              >
                                <span className="material-symbols-outlined text-sm font-bold">send</span>
                              </button>
                            </div>
                          )}

                        </div>

                        {/* Unread circle dot */}
                        {item.unread && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                        
                      </div>

                      {/* Clear Alert Trash button visible on hover */}
                      <div className="absolute top-md right-md opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button 
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-sm bg-white border border-outline-variant/60 rounded-full text-outline hover:text-error hover:border-error transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          title="Delete alert"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>

                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Load older button */}
            {feed.length > 0 && (
              <div className="mt-xl flex justify-center pb-xl">
                <button className="flex items-center gap-sm px-xl py-md border border-outline text-outline rounded-full hover:bg-slate-100 transition-all font-label-lg font-bold text-xs tracking-wider cursor-pointer bg-transparent">
                  Load Older Notifications
                  <span className="material-symbols-outlined text-md">expand_more</span>
                </button>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* FOOTER COHESIVE BAR */}
      <footer className={`w-full py-lg px-margin-desktop bg-slate-900 text-slate-300 border-t border-slate-800 z-40 select-none ${isOfficerOrAdmin ? 'md:pl-72' : ''}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center w-full">
          <div className="mb-md md:mb-0 text-left">
            <span className="font-label-lg text-label-lg font-bold text-white tracking-wider">Civic Pulse Governance Panel</span>
            <p className="text-xs opacity-75 mt-1">© 2026 Civic Pulse Government Solutions. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-lg text-xs font-bold">
            <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>System Compliance</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
