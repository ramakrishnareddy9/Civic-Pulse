import React, { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Reusable Modal component
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {string} [props.title] - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} [props.footer] - Modal footer (buttons)
 * @param {string} [props.size='md'] - Modal size (sm, md, lg, xl)
 * @param {boolean} [props.closeOnEscape=true] - Close on ESC key
 * @param {boolean} [props.closeOnBackdrop=true] - Close on backdrop click
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.ReactElement}
 */
export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdrop = true,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-full sm:max-w-sm',
    md: 'w-full sm:max-w-md',
    lg: 'w-full sm:max-w-lg',
    xl: 'w-full sm:max-w-xl',
  }

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeStyles[size]} ${className}`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t bg-gray-50">{footer}</div>}
      </div>
    </div>
  )
}
