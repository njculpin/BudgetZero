import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { Input } from '../ui'
import { useSignIn, useSignUp, useAuth, useSignInWithMagicLink } from '../../hooks/useAuth'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const navigate = useNavigate()
  const { data: user } = useAuth()
  const signInMutation = useSignIn()
  const signUpMutation = useSignUp()
  const magicLinkMutation = useSignInWithMagicLink()

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!useMagicLink) {
      if (!password) {
        newErrors.password = 'Password is required'
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }

      if (isSignUp && password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      if (useMagicLink) {
        await magicLinkMutation.mutateAsync({ email })
        setMagicLinkSent(true)
      } else {
        if (isSignUp) {
          await signUpMutation.mutateAsync({ email, password })
          alert('Check your email for a confirmation link!')
        } else {
          await signInMutation.mutateAsync({ email, password })
          navigate({ to: '/dashboard' })
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setErrors({ form: errorMessage })
    }
  }

  const isLoading = signInMutation.isPending || signUpMutation.isPending || magicLinkMutation.isPending

  return (
    <div className="app">
      <div className="container container--narrow" style={{ paddingTop: '4rem' }}>
        <Card>
          <CardHeader>
            <h1 className="text-center">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-center" style={{ marginTop: '0.5rem', color: 'var(--color-gray-600)' }}>
              {isSignUp ? 'Sign up to start managing your budgets' : 'Sign in to manage your budgets'}
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              {errors.form && (
                <div style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: '#fef2f2',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--color-error)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {errors.form}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="Enter your email"
                disabled={isLoading}
              />

              {/* Magic Link Toggle */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useMagicLink}
                    onChange={(e) => setUseMagicLink(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span style={{ fontSize: 'var(--font-size-sm)' }}>
                    Use magic link (passwordless sign in)
                  </span>
                </label>
              </div>

              {!useMagicLink && (
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              )}

              {isSignUp && !useMagicLink && (
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              )}

              {magicLinkSent ? (
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: 'var(--border-radius)',
                  color: '#0369a1',
                  marginBottom: 'var(--spacing-md)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 var(--spacing-xs) 0' }}>Check your email!</h3>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    We've sent a magic link to <strong>{email}</strong>. Click the link to sign in.
                  </p>
                </div>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  disabled={isLoading}
                  style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                >
                  {isLoading ? 'Loading...' : (
                    useMagicLink ? 'Send Magic Link' : (isSignUp ? 'Create Account' : 'Sign In')
                  )}
                </Button>
              )}

              {!useMagicLink && (
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setErrors({})
                      setPassword('')
                      setConfirmPassword('')
                      setMagicLinkSent(false)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    disabled={isLoading}
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              )}
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}