import React from 'react'

/**
 * Loading spinner component
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - Loading message
 * @param {string} [props.size='md'] - Spinner size (sm, md, lg)
 * @param {boolean} [props.fullScreen=false] - Full screen loading
 * @returns {React.ReactElement}
 */
export const Loading = ({ message = 'Loading...', size = 'md', fullScreen = false }) => {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        className={`animate-spin text-blue-600 ${sizeStyles[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * Error message component
 * @component
 * @param {Object} props - Component props
 * @param {string | Error} props.error - Error message or error object
 * @param {Function} [props.onRetry] - Retry callback
 * @param {boolean} [props.fullScreen=false] - Full screen error
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.ReactElement}
 */
export const Error = ({ error, onRetry, fullScreen = false, className = '' }) => {
  const message = typeof error === 'string' ? error : error?.message || 'An error occurred'

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="text-red-600">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18zm0 0a9 9 0 110 18 9 9 0 010-18z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 text-sm mb-4">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 bg-white flex items-center justify-center z-50 ${className}`}>
        {content}
      </div>
    )
  }

  return <div className={`p-4 bg-red-50 rounded-lg border border-red-200 ${className}`}>{content}</div>
}

/**
 * Empty state component
 * @component
 * @param {Object} props - Component props
 * @param {string} props.message - Empty message
 * @param {React.ReactNode} [props.icon] - Icon component
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.ReactElement}
 */
export const Empty = ({ message, icon: Icon = null, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
      {Icon && <div className="text-gray-400">{Icon}</div>}
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}
