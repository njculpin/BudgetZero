import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`card__header ${className}`.trim()}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', style }: CardBodyProps) {
  return (
    <div className={`card__content ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`card__footer ${className}`.trim()}>
      {children}
    </div>
  )
}