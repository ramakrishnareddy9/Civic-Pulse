import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Form'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES, VALIDATION, ERRORS } from '@utils/constants'

/**
 * Reset password page with 3-step flow:
 * 1. Request password reset (email)
 * 2. Verify token (token from email)
 * 3. Set new password
 */
export function ResetPasswordPage() {
  const { requestPasswordReset, resetPassword } = useAuth()
  const { success: showSuccess, error: showError } = useNotification()

  const [step, setStep] = useState(1) // 1: email, 2: token, 3: password
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    email: '',
    token: '',
    password: '',
    confirmPassword: '',
  })

  /**
   * Step 1: Request password reset
   */
  const handleRequestReset = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = ERRORS.REQUIRED_FIELD
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = ERRORS.INVALID_EMAIL
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      await requestPasswordReset(formData.email)
      showSuccess('Check your email for password reset instructions')
      setStep(2)
    } catch (err) {
      showError(err?.message || 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 3: Set new password
   */
  const handleSetPassword = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.token) {
      newErrors.token = ERRORS.REQUIRED_FIELD
    }

    if (!formData.password) {
      newErrors.password = ERRORS.REQUIRED_FIELD
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = ERRORS.INVALID_PASSWORD
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = ERRORS.REQUIRED_FIELD
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      await resetPassword(formData.token, formData.password)
      showSuccess('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        window.location.href = ROUTES.LOGIN
      }, 2000)
    } catch (err) {
      showError(err?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
        {/* Back Button */}
        <Link to={ROUTES.LOGIN} className="flex items-center text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft size={18} className="mr-2" />
          Back to login
        </Link>

        {/* Step 1: Request Password Reset */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleRequestReset} className="space-y-6">
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

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Send Reset Link
                </Button>
              </form>
            </div>
          </>
        )}

        {/* Step 2: Enter Token and Password */}
        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
              <p className="text-gray-600">
                Check your email for the reset code and enter it below.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleSetPassword} className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Check your email:</strong> We sent a reset code to{' '}
                    <strong>{formData.email}</strong>. If you don't see it, check your spam folder.
                  </p>
                </div>

                <Input
                  label="Reset Code"
                  type="text"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  placeholder="Enter the code from your email"
                  error={errors.token}
                  required
                  disabled={loading}
                />

                <Input
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter a strong password"
                  error={errors.password}
                  icon={<Lock size={18} />}
                  required
                  disabled={loading}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword}
                  icon={<Lock size={18} />}
                  required
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Reset Password
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Use Different Email
                </Button>
              </form>
            </div>
          </>
        )}

        {/* Troubleshooting Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 font-medium mb-2">Didn't receive an email?</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Links expire after 24 hours</li>
            <li>
              •{' '}
              <button
                onClick={() => {
                  setStep(1)
                  setFormData({ email: '', token: '', password: '', confirmPassword: '' })
                  setErrors({})
                }}
                className="text-blue-600 hover:underline"
              >
                Request a new link
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
