import { Component, ReactNode, ErrorInfo } from 'react'
import { Card, CardHeader, CardBody } from './Card'
import { Button } from './Button'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error to console for development
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private renderDefaultFallback(error?: Error, onRetry?: () => void) {
    return (
      <div className="error-boundary">
        <Card>
          <CardHeader>
            <h2>Something went wrong</h2>
          </CardHeader>
          <CardBody>
            <div className="error-boundary__content">
              <p className="error-boundary__message">
                We apologize for the inconvenience. An unexpected error occurred while loading this section.
              </p>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="error-boundary__details">
                  <summary>Error Details (Development)</summary>
                  <pre className="error-boundary__stack">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}

              <div className="error-boundary__actions">
                <Button variant="primary" onClick={onRetry}>
                  Try Again
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return this.renderDefaultFallback(this.state.error, this.handleRetry)
    }

    return this.props.children
  }
}