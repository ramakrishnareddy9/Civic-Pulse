import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { post } from '@api/client'
import { ROUTES, VALIDATION, ERRORS } from '@utils/constants'

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%)', test: p => /[!@#$%^&*]/.test(p) },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, error: authError } = useAuth()
  const { success: showSuccess, error: showError } = useNotification()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState(null) // triggers verify-email screen
  const [resending, setResending] = useState(false)

  const passChecks = formData.password
    ? PASSWORD_REQUIREMENTS.map(r => ({ ...r, passed: r.test(formData.password) }))
    : []
  const passStrength = passChecks.length ? passChecks.filter(r => r.passed).length : 0
  const strengthLabel = passStrength === 0 ? '' : passStrength <= 2 ? 'Weak' : passStrength <= 4 ? 'Fair' : 'Strong'
  const strengthColor = passStrength <= 2 ? '#ef4444' : passStrength <= 4 ? '#f59e0b' : '#22c55e'

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = ERRORS.REQUIRED_FIELD
    else if (formData.fullName.trim().length < 3) newErrors.fullName = 'Name must be at least 3 characters'
    if (!formData.email) newErrors.email = ERRORS.REQUIRED_FIELD
    else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) newErrors.email = ERRORS.INVALID_EMAIL

    if (!formData.password) newErrors.password = ERRORS.REQUIRED_FIELD
    else {
      const failedChecks = PASSWORD_REQUIREMENTS.filter(r => !r.test(formData.password))
      if (failedChecks.length > 0) newErrors.password = 'Password does not meet all requirements'
    }
    if (!formData.confirmPassword) newErrors.confirmPassword = ERRORS.REQUIRED_FIELD
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const success = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      })
      if (success) {
        // Show verify-email screen instead of redirecting
        setRegisteredEmail(formData.email)
      } else {
        showError(authError || 'Registration failed. Please try again.')
      }
    } catch (err) {
      showError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!registeredEmail || resending) return
    setResending(true)
    try {
      await post('/api/auth/resend-verification', { email: registeredEmail })
      showSuccess('Verification email resent! Please check your inbox.')
    } catch (err) {
      showError('Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const InputField = ({ label, name, type = 'text', placeholder, icon, required: req, showToggle, toggleState, onToggle, error: fieldError, autoComplete }) => (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gov-text)' }}>
        {label} {req && <span style={{ color: 'var(--gov-red)' }}>*</span>}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">{icon}</span>
        <input
          type={showToggle ? (toggleState ? 'text' : 'password') : type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={loading}
          className={`gov-input pl-10 ${showToggle ? 'pr-10' : ''} ${fieldError ? 'error' : ''}`}
          autoComplete={autoComplete}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-lg">{toggleState ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {fieldError && (
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: 'var(--gov-red)' }}>
          <span className="material-symbols-outlined text-sm">error</span>
          {fieldError}
        </p>
      )}
    </div>
  )

  // ── Email verification gate — shown after successful registration ──────────
  if (registeredEmail) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4" style={{ background: 'var(--gov-surface)' }}>
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="bg-white rounded-2xl border p-10 shadow-lg" style={{ borderColor: 'var(--gov-border)' }}>
            {/* Icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#10b981', fontVariationSettings: "'FILL' 1" }}>mark_email_unread</span>
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--gov-navy)' }}>Check Your Inbox</h1>
            <p className="text-sm mb-1" style={{ color: 'var(--gov-text-muted)' }}>
              We sent a verification link to:
            </p>
            <p className="font-bold text-base mb-6" style={{ color: 'var(--gov-navy)' }}>{registeredEmail}</p>
            <p className="text-sm mb-8" style={{ color: 'var(--gov-text-muted)' }}>
              Click the link in the email to activate your account. You must verify your email before you can log in.
              The link expires in <strong>24 hours</strong>.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 rounded-xl font-bold text-sm border transition-all hover:shadow-sm"
                style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)', background: 'white' }}
              >
                {resending
                  ? <span className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Resending…</span>
                  : <span className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-sm">send</span> Resend Verification Email</span>
                }
              </button>
              <Link
                to={ROUTES.LOGIN}
                className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all"
                style={{ background: 'var(--gov-navy)', color: 'white', textDecoration: 'none' }}
              >
                Go to Login
              </Link>
            </div>

            {/* Tips */}
            <div className="mt-8 p-4 rounded-xl text-left text-xs" style={{ background: '#f8fafc', color: 'var(--gov-text-muted)' }}>
              <p className="font-semibold mb-1">Didn't receive the email?</p>
              <ul className="space-y-0.5">
                <li>• Check your spam / junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Wait a few minutes before resending</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex" style={{ background: 'var(--gov-surface)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--gov-navy-dark) 0%, var(--gov-navy) 50%, #1a3d7c 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-2" style={{ borderColor: 'var(--gov-gold)', background: 'rgba(198,162,39,0.12)' }}>
            <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div>
            <div className="text-white font-black text-lg tracking-tight leading-none">CIVIC PULSE</div>
            <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--gov-gold)', opacity: 0.85 }}>Government Services Portal</div>
          </div>
        </div>

        <div className="relative z-10">
          <div
            className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold mb-6 border"
            style={{ borderColor: 'rgba(198,162,39,0.3)', color: 'var(--gov-gold)', background: 'rgba(198,162,39,0.1)' }}
          >
            ● Become a Citizen
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">Join Civic Pulse<br />Today</h1>
          <p className="text-white/65 text-base leading-relaxed mb-8 max-w-sm">
            Create your citizen account and start reporting civic issues, tracking resolutions, and making your voice heard in your community.
          </p>
          {[
            { icon: 'check_circle', text: 'Free to register — no fees ever' },
            { icon: 'security', text: 'Your data is protected by government policy' },
            { icon: 'notifications', text: 'Instant SMS & email status updates' },
            { icon: 'support_agent', text: 'Dedicated ward officer assigned to you' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-lg" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              <span className="text-sm text-white/75">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 p-4 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs text-white/40 leading-relaxed">
            By registering, you acknowledge that you are providing information to an official government platform. False submissions may be subject to penalty under applicable civic code.
          </p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2" style={{ borderColor: 'var(--gov-navy)', background: 'rgba(10,35,66,0.07)' }}>
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--gov-navy)', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div className="font-black text-lg tracking-tight" style={{ color: 'var(--gov-navy)' }}>CIVIC PULSE</div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--gov-navy)' }}>Create Account</h2>
            <p className="text-sm text-gray-500">Join Civic Pulse to help improve your community.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Full Name" name="fullName" icon="person"
              placeholder="Enter your full name" required autoComplete="name"
              error={errors.fullName}
            />

            <InputField
              label="Email Address" name="email" type="email" icon="mail"
              placeholder="your@email.gov.in" required autoComplete="email"
              error={errors.email}
            />

            {/* Account type info */}
            <div className="p-4 rounded-xl border flex items-start gap-3" style={{ borderColor: 'var(--gov-border)', background: '#f0f4ff' }}>
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: 'var(--gov-blue)', fontVariationSettings: "'FILL' 1" }}>info</span>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--gov-navy)' }}>Citizen Registration</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--gov-text-muted)' }}>
                  This form creates a <strong>Citizen</strong> account. Government Officer accounts are issued by the system administrator and cannot be self-registered.
                </p>
              </div>
            </div>

            <InputField
              label="Password" name="password" icon="lock"
              placeholder="Create a strong password" required
              showToggle toggleState={showPassword} onToggle={() => setShowPassword(!showPassword)}
              error={errors.password}
            />

            {/* Password strength indicator */}
            {formData.password && (
              <div className="space-y-2">
                {/* Strength bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(passStrength / 5) * 100}%`,
                        background: strengthColor,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: strengthColor, minWidth: 40 }}>{strengthLabel}</span>
                </div>
                {/* Requirements list */}
                <div className="grid grid-cols-1 gap-1">
                  {passChecks.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ color: r.passed ? '#22c55e' : '#94a3b8', fontVariationSettings: `'FILL' ${r.passed ? 1 : 0}` }}
                      >
                        {r.passed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span style={{ color: r.passed ? '#166534' : '#94a3b8' }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <InputField
              label="Confirm Password" name="confirmPassword" icon="lock"
              placeholder="Re-enter your password" required
              showToggle toggleState={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword}
            />

            {/* Confirm password match indicator */}
            {formData.confirmPassword && formData.password && (
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{
                    color: formData.password === formData.confirmPassword ? '#22c55e' : '#ef4444',
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  {formData.password === formData.confirmPassword ? 'check_circle' : 'cancel'}
                </span>
                <span style={{ color: formData.password === formData.confirmPassword ? '#166534' : '#dc2626' }}>
                  {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}

            {/* Terms agreement */}
            <div className={`p-4 rounded-xl border ${errors.agreeToTerms ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-0.5 w-4 h-4 accent-blue-700 shrink-0"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I have read and agree to the{' '}
                  <a href="#" className="font-semibold hover:underline" style={{ color: 'var(--gov-blue)' }} onClick={e => e.preventDefault()}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="font-semibold hover:underline" style={{ color: 'var(--gov-blue)' }} onClick={e => e.preventDefault()}>Privacy Policy</a>
                  {' '}of Civic Pulse Government Portal.
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--gov-red)' }}>
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.agreeToTerms}
                </p>
              )}
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
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                  Create My Account
                </>
              )}
            </button>
          </form>

          {/* Already have account */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--gov-border)' }} />
            <span className="text-xs text-gray-400 font-medium">Already registered?</span>
            <div className="flex-1 h-px" style={{ background: 'var(--gov-border)' }} />
          </div>

          <Link
            to={ROUTES.LOGIN}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-200 hover:bg-gray-50"
            style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)' }}
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  )
}
