import React from 'react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  size?: 'small' | 'medium' | 'large'
}

export function Input({
  label,
  error,
  size = 'medium',
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const baseClass = 'input'
  const sizeClass = size !== 'medium' ? `${baseClass}--${size}` : ''
  const errorClass = error ? `${baseClass}--error` : ''
  const fullClassName = `${baseClass} ${sizeClass} ${errorClass} ${className}`.trim()

  return (
    <div className="input-field">
      {label && (
        <label htmlFor={inputId} className="input-field__label">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        className={fullClassName}
      />
      {error && (
        <span className="input-field__error">
          {error}
        </span>
      )}
    </div>
  )
}