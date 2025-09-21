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
      <aside className="dashboard__sidebar">
        <div className="dashboard__brand">
          <h2>Budget Zero</h2>
          {user?.email && (
            <p className="dashboard__user-email">
              {user.email}
            </p>
          )}
        </div>

        <nav>
          <ul className="nav">
            {navItems.map(({ key, label, to }) => (
              <li key={key} className="nav__item">
                <Link
                  to={to}
                  className={`nav__link ${currentPage === key ? 'nav__link--active' : ''}`}
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
          >
            {signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </aside>

      <main className="dashboard__main">
        {children}
      </main>
    </div>
  )
}