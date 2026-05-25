import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'
import { Button } from '@components/common/Button'
import { Input, Select, Checkbox } from '@components/common/Form'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES, VALIDATION, ERRORS, SUCCESS } from '@utils/constants'

/**
 * Register page component
 * Handles new user registration with validation
 */
export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { success: showSuccess, error: showError } = useNotification()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'CITIZEN',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const roleOptions = [
    { value: 'CITIZEN', label: 'Citizen' },
    { value: 'OFFICER', label: 'Government Officer' },
  ]

  /**
   * Validate password strength
   */
  const validatePasswordStrength = (password) => {
    const issues = []
    if (password.length < 8) issues.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) issues.push('One uppercase letter')
    if (!/[a-z]/.test(password)) issues.push('One lowercase letter')
    if (!/[0-9]/.test(password)) issues.push('One number')
    if (!/[!@#$%^&*]/.test(password)) issues.push('One special character (!@#$%^&*)')
    return issues
  }

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = ERRORS.REQUIRED_FIELD
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = ERRORS.REQUIRED_FIELD
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = ERRORS.INVALID_EMAIL
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = ERRORS.REQUIRED_FIELD
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = ERRORS.REQUIRED_FIELD
    }

    const passwordIssues = validatePasswordStrength(formData.password)
    if (passwordIssues.length > 0) {
      newErrors.passwordStrength = `Password must contain: ${passwordIssues.join(', ')}`
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = ERRORS.REQUIRED_FIELD
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
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
      await register({
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      })
      showSuccess(SUCCESS.REGISTER)
      // Redirect to login or dashboard (depends on backend setup)
      navigate(ROUTES.LOGIN)
    } catch (err) {
      showError(err?.message || 'Registration failed. Please try again.')
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
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const passwordIssues = formData.password ? validatePasswordStrength(formData.password) : []
  const passwordStrength =
    formData.password && passwordIssues.length === 0 ? 'strong' : passwordIssues.length > 0 ? 'weak' : 'none'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join CivicPulse to help improve your community</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <Input
              label="Full Name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={errors.fullName}
              icon={<User size={18} />}
              required
              disabled={loading}
            />

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

            {/* Role Selection */}
            <Select
              label="Select Your Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              error={errors.role}
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
              placeholder="Create a strong password"
              error={errors.password}
              icon={<Lock size={18} />}
              required
              disabled={loading}
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                <div className="space-y-1">
                  {passwordIssues.map((issue) => (
                    <div key={issue} className="flex items-center text-xs text-red-600">
                      <span className="mr-2">✗</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                  {passwordIssues.length === 0 && (
                    <div className="flex items-center text-xs text-green-600">
                      <span className="mr-2">✓</span>
                      <span>Password is strong</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirm Password */}
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

            {/* Terms Agreement */}
            <div className={`p-4 bg-gray-50 rounded-lg border ${errors.agreeToTerms ? 'border-red-200' : 'border-gray-200'}`}>
              <Checkbox
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={loading}
                label={
                  <span>
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                }
              />
              {errors.agreeToTerms && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.agreeToTerms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
              className="mt-6"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link to={ROUTES.LOGIN}>
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              disabled={loading}
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>
            By creating an account, you acknowledge that you have read our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>{' '}
            and agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
