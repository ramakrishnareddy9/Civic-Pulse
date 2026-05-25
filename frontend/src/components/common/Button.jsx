import React from 'react'

/**
 * Reusable Button component with multiple variants
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger, success)
 * @param {string} [props.size='md'] - Button size (sm, md, lg)
 * @param {boolean} [props.loading=false] - Loading state
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {*} [props.icon] - Icon component to display
 * @param {boolean} [props.fullWidth=false] - Full width button
 * @returns {React.ReactElement}
 */
export const Button = React.forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className = '',
      children,
      icon: Icon = null,
      ariaLabel = undefined,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none mui-focus-ring'

    const variants = {
      // MUI-like palette
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
      secondary: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 focus:ring-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
      ghost: 'bg-transparent hover:bg-gray-50 text-gray-900',
      outline: 'border-2 border-gray-300 hover:border-gray-400 bg-transparent text-gray-900',
    }

    const sizes = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    }

    const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${widthStyles} ${className} mui-elevation-1`}
        aria-label={ariaLabel}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          <>
            {Icon && (
              // Support both component (e.g. icon={Plus}) and element (e.g. icon={<Plus />})
              (React.isValidElement(Icon)
                ? Icon
                : typeof Icon === 'function'
                ? <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
                : null)
            )}
            {children}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
