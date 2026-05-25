import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useUiStore } from '@store/uiStore'
import { ROUTES } from '@utils/constants'

export default function Header() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { notifications } = useUiStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch (e) {
      return 'light'
    }
  })

  useEffect(() => {
    const apply = (t) => {
      const root = document.documentElement
      if (t === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }
    apply(theme)
    try {
      localStorage.setItem('theme', theme)
    } catch (e) {}
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate(ROUTES.LOGIN)
  }

  // Filter unread notifications
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0

  return (
    <header className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-sm sticky top-0 z-50 bg-white border-b border-outline-variant shadow-sm transition-colors">
      <Link to="/" className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
        CIVIC PULSE
      </Link>

      <nav className="hidden md:flex items-center gap-lg">
        <Link 
          to="/" 
          className="text-on-surface-variant pb-1 font-label-lg text-label-lg hover:text-primary transition-colors"
        >
          Home
        </Link>
        {isAuthenticated && user?.role === 'CITIZEN' && (
          <>
            <Link 
              to={ROUTES.CITIZEN.DASHBOARD} 
              className="text-on-surface-variant pb-1 font-label-lg text-label-lg hover:text-primary transition-colors"
            >
              My Complaints
            </Link>
            <Link 
              to={ROUTES.CITIZEN.SUBMIT_COMPLAINT} 
              className="text-on-surface-variant pb-1 font-label-lg text-label-lg hover:text-primary transition-colors"
            >
              Submit Complaint
            </Link>
          </>
        )}
        {isAuthenticated && user?.role === 'OFFICER' && (
          <Link 
            to={ROUTES.OFFICER.DASHBOARD} 
            className="text-on-surface-variant pb-1 font-label-lg text-label-lg hover:text-primary transition-colors font-bold text-primary"
          >
            Officer Triage
          </Link>
        )}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <>
            <Link 
              to={ROUTES.ADMIN.DASHBOARD} 
              className="text-on-surface-variant pb-1 font-label-lg text-label-lg hover:text-primary transition-colors"
            >
              Analytics
            </Link>
            <Link 
              to="/admin/officers" 
              className="text-on-surface-variant pb-1 font-label-lg text-label-lg hover:text-primary transition-colors"
            >
              Permissions
            </Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-md relative">
        {isAuthenticated && (
          <Link to="/notifications" className="relative p-1 hover:bg-surface-container rounded-full text-primary transition-colors">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        )}

        <button 
          onClick={toggleTheme} 
          className="material-symbols-outlined p-1 hover:bg-surface-container rounded-full text-primary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </button>

        {isAuthenticated ? (
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="material-symbols-outlined p-1 hover:bg-surface-container rounded-full text-primary transition-colors flex items-center justify-center cursor-pointer"
              aria-label="User Profile"
            >
              account_circle
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded-xl shadow-lg py-2 z-50 animate-fade-in text-left">
                <div className="px-4 py-2 border-b border-outline-variant">
                  <p className="font-label-lg text-label-lg text-primary truncate">{user.fullName || user.email}</p>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-label-md text-error hover:bg-error-container/10 transition-colors flex items-center gap-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to={ROUTES.LOGIN} 
            className="bg-primary text-on-primary px-md py-xs rounded-lg font-label-lg text-label-lg hover:opacity-90 transition-all cursor-pointer"
          >
            Log In
          </Link>
        )}

        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden material-symbols-outlined text-primary p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          {menuOpen ? 'close' : 'menu'}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-outline-variant shadow-md p-md flex flex-col gap-sm md:hidden z-40 animate-fade-in text-left">
          <Link 
            to="/" 
            onClick={() => setMenuOpen(false)}
            className="text-on-surface-variant font-label-lg text-label-lg hover:text-primary py-1"
          >
            Home
          </Link>
          {isAuthenticated && user?.role === 'CITIZEN' && (
            <>
              <Link 
                to={ROUTES.CITIZEN.DASHBOARD} 
                onClick={() => setMenuOpen(false)}
                className="text-on-surface-variant font-label-lg text-label-lg hover:text-primary py-1"
              >
                My Complaints
              </Link>
              <Link 
                to={ROUTES.CITIZEN.SUBMIT_COMPLAINT} 
                onClick={() => setMenuOpen(false)}
                className="text-on-surface-variant font-label-lg text-label-lg hover:text-primary py-1"
              >
                Submit Complaint
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'OFFICER' && (
            <Link 
              to={ROUTES.OFFICER.DASHBOARD} 
              onClick={() => setMenuOpen(false)}
              className="text-on-surface-variant font-label-lg text-label-lg hover:text-primary py-1"
            >
              Officer Triage
            </Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <>
              <Link 
                to={ROUTES.ADMIN.DASHBOARD} 
                onClick={() => setMenuOpen(false)}
                className="text-on-surface-variant font-label-lg text-label-lg hover:text-primary py-1"
              >
                Analytics
              </Link>
              <Link 
                to="/admin/officers" 
                onClick={() => setMenuOpen(false)}
                className="text-on-surface-variant font-label-lg text-label-lg hover:text-primary py-1"
              >
                Permissions
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

