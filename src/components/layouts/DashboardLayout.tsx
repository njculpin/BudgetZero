import React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth, useSignOut } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import './DashboardLayout.css'

export type DashboardPage = 'dashboard' | 'projects' | 'discover' | 'collaborations' | 'marketplace'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage: DashboardPage
}

export function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const signOutMutation = useSignOut()

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync()
      navigate({ to: '/' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
    { key: 'projects', label: 'My Projects', to: '/projects' },
    { key: 'discover', label: 'Discover', to: '/discover' },
    { key: 'collaborations', label: 'Collaborations', to: '/collaborations' },
    { key: 'marketplace', label: 'Marketplace', to: '/marketplace' }
  ] as const

  return (
    <div className="dashboard">
      <aside className="dashboard__sidebar" role="navigation" aria-label="Application sidebar">
        <div className="dashboard__brand">
          <h1>Budget Zero</h1>
          {user?.email && (
            <p className="dashboard__user-email" aria-label={`Signed in as ${user.email}`}>
              {user.email}
            </p>
          )}
        </div>

        <nav aria-label="Main navigation">
          <ul className="nav" role="list">
            {navItems.map(({ key, label, to }) => (
              <li key={key} className="nav__item">
                <Link
                  to={to}
                  className={`nav__link ${currentPage === key ? 'nav__link--active' : ''}`}
                  aria-current={currentPage === key ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="dashboard__actions">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            disabled={signOutMutation.isPending}
            aria-label="Sign out of your account"
          >
            {signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </aside>

      <main className="dashboard__main" role="main" aria-label="Main content">
        {children}
      </main>
    </div>
  )
}