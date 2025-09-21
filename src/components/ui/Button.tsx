import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  style
}: ButtonProps) {
  const baseClass = 'btn'
  const modifierClasses = `${baseClass}--${variant} ${baseClass}--${size}`
  const fullClassName = `${baseClass} ${modifierClasses} ${className}`.trim()

  return (
    <button
      type={type}
      className={fullClassName}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  )
}