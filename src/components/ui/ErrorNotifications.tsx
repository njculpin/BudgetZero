import React from 'react'
import { useErrorHandler } from '../../contexts/ErrorContext'
import { Button } from './Button'
import './ErrorNotifications.css'

export function ErrorNotifications() {
  const { errors, removeError } = useErrorHandler()

  if (errors.length === 0) {
    return null
  }

  return (
    <div className="error-notifications" role="alert" aria-live="polite">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`error-notification error-notification--${error.type}`}
          role="alert"
        >
          <div className="error-notification__content">
            <div className="error-notification__message">
              {error.message}
            </div>

            <div className="error-notification__actions">
              {error.action && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    error.action?.handler()
                    removeError(error.id)
                  }}
                >
                  {error.action.label}
                </Button>
              )}

              <Button
                variant="secondary"
                size="small"
                onClick={() => removeError(error.id)}
                aria-label="Dismiss notification"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}