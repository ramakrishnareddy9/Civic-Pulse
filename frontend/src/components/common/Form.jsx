import React from 'react'

/**
 * Form input component with label, error state, and icon support
 * @component
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, number, etc.)
 * @param {string} props.name - Input name attribute
 * @param {string} [props.value] - Input value
 * @param {Function} [props.onChange] - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.required=false] - Required field
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {*} [props.icon] - Icon component (Lucide)
 * @returns {React.ReactElement}
 */
export const Input = React.forwardRef(
  (
    {
      label,
      type = 'text',
      name,
      value,
      onChange,
      placeholder,
      error,
      disabled = false,
      required = false,
      className = '',
      icon: Icon = null,
      ...props
    },
    ref
  ) => {
    return (
      <div className="mb-4">
        {label && (
            <label htmlFor={name} className="block mui-label mb-1">
            {label}
              {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && <div className="absolute left-3 top-3 text-gray-400">{Icon}</div>}
            <input
            ref={ref}
            id={name}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
              className={`w-full px-3 py-2 ${Icon ? 'pl-10' : ''} rounded-md border bg-white ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors shadow-sm ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * TextArea component for multi-line input
 * @component
 */
export const TextArea = React.forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      placeholder,
      error,
      disabled = false,
      required = false,
      rows = 4,
      maxLength,
      className = '',
      ...props
    },
    ref
  ) => {
    const currentLength = value?.length || 0

    return (
      <div className="mb-4">
        {label && (
            <label htmlFor={name} className="block mui-label mb-1">
            {label}
              {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
            className={`w-full px-3 py-2 rounded-md border bg-white ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none transition-colors shadow-sm ${className}`}
          {...props}
        />
        <div className="flex justify-between items-center mt-1">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {maxLength && <p className="text-xs text-gray-500">{currentLength}/{maxLength}</p>}
        </div>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

/**
 * Select component for dropdown selections
 * @component
 */
export const Select = React.forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      options = [],
      error,
      disabled = false,
      required = false,
      placeholder = 'Select an option',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={name} className="block mui-label mb-1">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3 py-2 rounded-md border bg-white ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors shadow-sm ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

/**
 * Checkbox component
 * @component
 */
export const Checkbox = React.forwardRef(
  ({ label, name, checked, onChange, error, disabled = false, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        <div className="flex items-center">
          <input
            ref={ref}
            id={name}
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
          />
          {label && (
            <label htmlFor={name} className="ml-2 text-sm text-gray-800">
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
