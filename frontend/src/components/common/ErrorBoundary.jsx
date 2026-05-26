import React from 'react'

/**
 * Error Boundary component to catch and display React errors gracefully
 * Prevents entire app crash on component errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    })
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // Optional: reload the page
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4"
          style={{ background: 'var(--gov-surface)' }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border" style={{ borderColor: 'var(--gov-border)' }}>
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(220,38,38,0.1)' }}>
              <span className="material-symbols-outlined text-4xl text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--gov-navy)' }}>
              Oops! Something went wrong
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--gov-text-muted)' }}>
              An unexpected error occurred. Our team has been notified. Please try refreshing the page.
            </p>

            {/* Error Details (Dev Mode) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 p-4 rounded-lg border text-xs" style={{ background: '#f3f4f6', borderColor: 'var(--gov-border)' }}>
                <summary className="cursor-pointer font-semibold mb-2 text-red-600">
                  Error Details (Development Only)
                </summary>
                <div className="whitespace-pre-wrap break-words font-mono text-[11px] overflow-auto max-h-40 text-gray-700">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="gov-btn-primary w-full font-bold py-3 rounded-xl"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Try Again
              </button>
              <a
                href="/"
                className="gov-btn-outline w-full font-bold py-3 rounded-xl text-center"
                style={{ textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Back to Home
              </a>
            </div>

            {/* Support Info */}
            <div className="mt-6 pt-4 border-t text-xs" style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text-muted)' }}>
              <p className="mb-1">Need help? Contact support:</p>
              <a href="tel:1800-123-4567" className="text-blue-600 hover:underline">
                1800-123-4567
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
