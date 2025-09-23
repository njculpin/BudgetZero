import { createContext, useContext, useState, ReactNode } from 'react'

export interface ErrorMessage {
  id: string
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  timestamp: number
  action?: {
    label: string
    handler: () => void
  }
}

interface ErrorContextType {
  errors: ErrorMessage[]
  addError: (message: string, type?: ErrorMessage['type'], action?: ErrorMessage['action']) => string
  removeError: (id: string) => void
  clearAllErrors: () => void
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider')
  }
  return context
}

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorMessage[]>([])

  const addError = (message: string, type: ErrorMessage['type'] = 'error', action?: ErrorMessage['action']) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const error: ErrorMessage = {
      id,
      message,
      type,
      timestamp: Date.now(),
      action
    }

    setErrors(prev => [...prev, error])

    // Auto-remove success and info messages after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        removeError(id)
      }, 5000)
    }

    return id
  }

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }

  const clearAllErrors = () => {
    setErrors([])
  }

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearAllErrors }}>
      {children}
    </ErrorContext.Provider>
  )
}