import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useNotifications } from '@hooks/useNotifications'
import { ROUTES } from '@utils/constants'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [devMockActive, setDevMockActive] = useState(false)
  const profileRef = useRef(null)

  // Listen for dev mock usage flag from the API client
  useEffect(() => {
    const checkFlag = () => {
      try {
        if (import.meta.env.DEV && window.__DEV_MOCK_USED__) setDevMockActive(true)
      } catch (e) {}
    }
    checkFlag()
    const handler = () => setDevMockActive(true)
    window.addEventListener('dev-mock-used', handler)
    return () => window.removeEventListener('dev-mock-used', handler)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate(ROUTES.LOGIN)
  }

  // unreadCount is now sourced from useNotifications (real backend)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const NavLink = ({ to, children, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive(to)
          ? 'text-white bg-white/15 font-semibold'
          : 'text-white/75 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
      {isActive(to) && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400 mb-0.5" />
      )}
    </Link>
  )

  // Role-specific navigation items
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { to: '/', label: 'Home' },
      ]
    }
    if (user?.role === 'CITIZEN') {
      return [
        { to: '/', label: 'Home' },
        { to: ROUTES.CITIZEN.DASHBOARD, label: 'My Complaints' },
        { to: ROUTES.CITIZEN.SUBMIT_COMPLAINT, label: 'Submit Complaint' },
      ]
    }
    if (user?.role === 'OFFICER') {
      return [
        { to: ROUTES.OFFICER.DASHBOARD, label: 'Triage Queue' },
        { to: '/notifications', label: 'Notifications' },
      ]
    }
    if (user?.role === 'ADMIN') {
      return [
        { to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard' },
        { to: '/admin/departments', label: 'Departments' },
        { to: '/admin/officers', label: 'Officers' },
        { to: '/admin/wards', label: 'Wards' },
      ]
    }
    return []
  }

  const navItems = getNavItems()

  // Role badge
  const roleBadge = {
    CITIZEN: { label: 'Citizen', color: '#22c55e' },
    OFFICER: { label: 'Officer', color: '#f59e0b' },
    ADMIN: { label: 'Administrator', color: '#ef4444' },
  }

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'linear-gradient(135deg, var(--gov-navy-dark) 0%, var(--gov-navy) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--gov-gold) 0%, var(--gov-blue-light) 50%, var(--gov-gold) 100%)' }} />

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center h-14 gap-6">
        {/* Logo & Branding */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          {/* Gov seal circle */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-105"
            style={{ borderColor: 'var(--gov-gold)', background: 'rgba(198,162,39,0.15)' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div className="leading-none">
            <div className="text-white font-black text-base tracking-tight leading-none">CIVIC PULSE</div>
            <div className="text-[9px] font-medium tracking-widest uppercase" style={{ color: 'var(--gov-gold)', opacity: 0.9 }}>Government Services Portal</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notification Bell */}
          {isAuthenticated && (
            <Link
              to="/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[22px] text-white/80">notifications</span>
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#ef4444' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Profile / Login */}
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                aria-label="User menu"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'var(--gov-blue)' }}
                >
                  {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-none">
                  <div className="text-white text-xs font-semibold truncate max-w-[120px]">
                    {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-[9px] font-medium" style={{ color: roleBadge[user?.role]?.color || '#94a3b8' }}>
                    {roleBadge[user?.role]?.label || user?.role}
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-white/50 hidden sm:block">expand_more</span>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border animate-slide-down"
                  style={{ background: 'white', borderColor: 'var(--gov-border)', zIndex: 200 }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--gov-border)' }}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-2"
                      style={{ background: 'var(--gov-navy)' }}
                    >
                      {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-center truncate" style={{ color: 'var(--gov-text)' }}>
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-xs text-center font-medium mt-0.5" style={{ color: roleBadge[user?.role]?.color }}>
                      {roleBadge[user?.role]?.label}
                    </p>
                  </div>

                  {/* Navigation links */}
                  <div className="py-1">
                    {user?.role === 'CITIZEN' && (
                      <>
                        <Link
                          to={ROUTES.CITIZEN.DASHBOARD}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: 'var(--gov-text)' }}
                        >
                          <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-navy)' }}>dashboard</span>
                          My Dashboard
                        </Link>
                        <Link
                          to={ROUTES.CITIZEN.SUBMIT_COMPLAINT}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: 'var(--gov-text)' }}
                        >
                          <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-navy)' }}>add_circle</span>
                          New Complaint
                        </Link>
                      </>
                    )}
                    {user?.role === 'OFFICER' && (
                      <Link
                        to={ROUTES.OFFICER.DASHBOARD}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: 'var(--gov-text)' }}
                      >
                        <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-navy)' }}>manage_accounts</span>
                        Triage Queue
                      </Link>
                    )}
                    {user?.role === 'ADMIN' && (
                      <Link
                        to={ROUTES.ADMIN.DASHBOARD}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: 'var(--gov-text)' }}
                      >
                        <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-navy)' }}>analytics</span>
                        Admin Console
                      </Link>
                    )}
                    <Link
                      to="/notifications"
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--gov-text)' }}
                    >
                      <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-navy)' }}>notifications</span>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto text-xs font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#ef4444' }}>
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="py-1 border-t" style={{ borderColor: 'var(--gov-border)' }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-red-50 transition-colors text-left"
                      style={{ color: '#dc2626' }}
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.LOGIN}
                className="text-white/80 hover:text-white text-sm font-medium px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
                style={{ background: 'var(--gov-gold)', color: '#1a1200' }}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-white">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div
          className="md:hidden border-t animate-slide-down"
          style={{ background: 'var(--gov-navy)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors mt-1"
                  style={{ background: 'var(--gov-gold)', color: '#1a1200' }}
                >
                  Create Account
                </Link>
              </>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2"
                style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)' }}
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
