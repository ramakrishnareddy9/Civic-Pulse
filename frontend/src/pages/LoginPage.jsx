import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES, VALIDATION, ERRORS } from '@utils/constants'

const DEMO_ACCOUNTS = [
  {
    email: 'admin@civicpulse.gov.in',
    role: 'Administrator',
    icon: 'admin_panel_settings',
    color: '#ef4444',
    bg: '#fee2e2',
  },
  {
    email: 'officer@civicpulse.gov.in',
    role: 'Department Officer',
    icon: 'badge',
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  {
    email: 'citizen@civicpulse.gov.in',
    role: 'Citizen',
    icon: 'person',
    color: '#22c55e',
    bg: '#dcfce7',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { error: showError } = useNotification()

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = ERRORS.REQUIRED_FIELD
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = ERRORS.INVALID_EMAIL
    }
    if (!formData.password) {
      newErrors.password = ERRORS.REQUIRED_FIELD
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = ERRORS.INVALID_PASSWORD
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      await login(formData.email, formData.password)
      // Navigate is handled by the store/redirect logic in App.jsx via isAuthenticated
    } catch (err) {
      showError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleDemoLogin = (email) => {
    setFormData(prev => ({ ...prev, email, password: 'password123' }))
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex" style={{ background: 'var(--gov-surface)' }}>
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--gov-navy-dark) 0%, var(--gov-navy) 50%, #1a3d7c 100%)',
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Top logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border-2"
            style={{ borderColor: 'var(--gov-gold)', background: 'rgba(198,162,39,0.12)' }}
          >
            <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div>
            <div className="text-white font-black text-lg tracking-tight leading-none">CIVIC PULSE</div>
            <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--gov-gold)', opacity: 0.85 }}>Government Services Portal</div>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative z-10">
          <div
            className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold mb-6 border"
            style={{ borderColor: 'rgba(198,162,39,0.3)', color: 'var(--gov-gold)', background: 'rgba(198,162,39,0.1)' }}
          >
            ● Secure Government Portal
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Welcome Back<br />to Civic Pulse
          </h1>
          <p className="text-white/65 text-base leading-relaxed mb-8 max-w-sm">
            Access your civic dashboard to track complaints, view notifications, and monitor municipal services in real-time.
          </p>
          {/* Feature bullets */}
          {[
            { icon: 'bolt', text: 'Instant complaint submission & tracking' },
            { icon: 'notifications_active', text: 'Real-time status notifications' },
            { icon: 'shield', text: 'Secure & DPDP-compliant platform' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(198,162,39,0.15)' }}
              >
                <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <span className="text-sm text-white/75">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom legal notice */}
        <div className="relative z-10 p-4 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs text-white/40 leading-relaxed">
            This is an official government digital service. Unauthorized access is prohibited and may be subject to legal action under applicable law. All activity is logged and monitored.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: 'var(--gov-navy)', background: 'rgba(10,35,66,0.07)' }}
            >
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--gov-navy)', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div className="font-black text-lg tracking-tight" style={{ color: 'var(--gov-navy)' }}>CIVIC PULSE</div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--gov-navy)' }}>Sign In</h2>
            <p className="text-sm text-gray-500">Enter your credentials to access your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gov-text)' }}>
                Email Address <span style={{ color: 'var(--gov-red)' }}>*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">mail</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.gov.in"
                  disabled={loading}
                  className={`gov-input pl-10 ${errors.email ? 'error' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: 'var(--gov-red)' }}>
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--gov-text)' }}>
                  Password <span style={{ color: 'var(--gov-red)' }}>*</span>
                </label>
                <Link
                  to={ROUTES.RESET_PASSWORD}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--gov-blue)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={`gov-input pl-10 pr-10 ${errors.password ? 'error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: 'var(--gov-red)' }}>
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-700"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer select-none">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200"
              style={{
                background: loading ? '#94a3b8' : 'var(--gov-navy)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(10,35,66,0.3)',
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--gov-border)' }} />
            <span className="text-xs text-gray-400 font-medium">Don't have an account?</span>
            <div className="flex-1 h-px" style={{ background: 'var(--gov-border)' }} />
          </div>

          <Link
            to={ROUTES.REGISTER}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-200 hover:bg-gray-50"
            style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)' }}
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Create New Account
          </Link>

          {/* Demo accounts panel */}
          <div
            className="mt-6 rounded-xl border p-4"
            style={{ background: 'rgba(10,35,66,0.03)', borderColor: 'rgba(10,35,66,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--gov-navy)' }}>info</span>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gov-navy)' }}>Development Demo Accounts</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">Click any account below to autofill credentials (any password works):</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => handleDemoLogin(acc.email)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all hover:shadow-sm text-left"
                  style={{ background: 'white', borderColor: 'var(--gov-border)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: acc.bg }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ color: acc.color, fontVariationSettings: "'FILL' 1" }}>{acc.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--gov-text)' }}>{acc.role}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--gov-text-muted)' }}>{acc.email}</p>
                  </div>
                  <span className="material-symbols-outlined text-sm ml-auto" style={{ color: 'var(--gov-text-light)' }}>arrow_forward</span>
                </button>
              ))}
            </div>
          </div>

          {/* Legal footer */}
          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-600" onClick={e => e.preventDefault()}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-gray-600" onClick={e => e.preventDefault()}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
