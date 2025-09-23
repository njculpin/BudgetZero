import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { NotionStyleSidebar } from './NotionStyleSidebar'
import './DashboardLayout.css'
import './NotionStyleSidebar.css'

export type DashboardPage = 'dashboard' | 'projects' | 'discover' | 'collaborations' | 'marketplace' | 'profile' | 'project'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: DashboardPage
}

export function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const { data: user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="dashboard">
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <NotionStyleSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
      />

      <main id="main-content" className="dashboard__main" role="main" aria-label="Main content">
        {children}
      </main>
    </div>
  )
}