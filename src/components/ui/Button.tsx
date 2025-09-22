import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  onClick?: ((e: React.FormEvent) => void | Promise<void>) | ((e: React.MouseEvent) => void | Promise<void>) | (() => void | Promise<void> | boolean)
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
  title?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean
}

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  style,
  title,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed
}: ButtonProps) {
  const baseClass = 'btn'
  const modifierClasses = `${baseClass}--${variant} ${baseClass}--${size}`
  const fullClassName = `${baseClass} ${modifierClasses} ${className}`.trim()

  return (
    <button
      type={type}
      className={fullClassName}
      disabled={disabled}
      onClick={(e) => {
        if (onClick) {
          // Handle different callback signatures
          if (onClick.length === 0) {
            (onClick as () => void | Promise<void> | boolean)()
          } else {
            (onClick as (e: React.MouseEvent) => void | Promise<void>)(e)
          }
        }
      }}
      style={style}
      title={title}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  )
}