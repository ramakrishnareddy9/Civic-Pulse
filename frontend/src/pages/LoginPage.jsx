import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Form'
import { Checkbox } from '@components/common/Form'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES, VALIDATION, ERRORS } from '@utils/constants'

/**
 * Login page component
 * Handles user authentication with email and password
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { error: showError } = useNotification()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  /**
   * Validate form fields
   */
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

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      await login(formData.email, formData.password)
      // Login hook handles redirect to dashboard
    } catch (err) {
      showError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CivicPulse</h1>
          <p className="text-gray-600">
            Welcome back! Sign in to your account to continue.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              error={errors.email}
              icon={<Mail size={18} />}
              required
              disabled={loading}
            />

            {/* Password Field */}
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              icon={<Lock size={18} />}
              required
              disabled={loading}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <Checkbox
                name="rememberMe"
                label="Remember me"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <Link
                to={ROUTES.RESET_PASSWORD}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link to={ROUTES.REGISTER}>
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              disabled={loading}
            >
              Create Account
            </Button>
          </Link>
        </div>

        {/* Local Testing Help Panel */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-md mt-md text-left text-xs text-indigo-950 shadow-sm">
          <div className="flex items-center gap-xs mb-xs font-bold text-indigo-900">
            <span className="material-symbols-outlined text-[16px] font-bold">info</span>
            <span>Local Development Accounts</span>
          </div>
          <p className="opacity-90 leading-relaxed mb-sm">
            Sign in immediately without a running backend server using the following mock accounts (any password):
          </p>
          <ul className="space-y-xs font-medium">
            <li className="flex justify-between items-center bg-white/60 px-sm py-1 rounded">
              <span>👑 Administrator:</span>
              <code className="bg-indigo-100/60 px-1 rounded text-primary font-bold">admin@civicpulse.gov.in</code>
            </li>
            <li className="flex justify-between items-center bg-white/60 px-sm py-1 rounded">
              <span>🛡️ Department Officer:</span>
              <code className="bg-indigo-100/60 px-1 rounded text-primary font-bold">officer@civicpulse.gov.in</code>
            </li>
            <li className="flex justify-between items-center bg-white/60 px-sm py-1 rounded">
              <span>🏠 Verified Citizen:</span>
              <code className="bg-indigo-100/60 px-1 rounded text-primary font-bold">citizen@civicpulse.gov.in</code>
            </li>
          </ul>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            By signing in, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
