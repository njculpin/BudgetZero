import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useRoleBasedProjects } from '../../hooks/useRoleBasedProjects'
import { useAuth } from '../../hooks/useAuth'
import { ProjectWithRoles } from '../../types/roles'
import { Button } from '../ui'

interface NotionStyleSidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  currentPage?: string
}

// Helper function to sort projects by relevance
const sortProjectsByRelevance = (projects: ProjectWithRoles[], userId: string) => {
  return [...projects].sort((a, b) => {
    // 1. Priority: Project lead role
    const aIsLead = a.my_roles.includes('project-lead')
    const bIsLead = b.my_roles.includes('project-lead')
    if (aIsLead !== bIsLead) return aIsLead ? -1 : 1

    // 2. Recent activity (updated_at)
    const aTime = new Date(a.updated_at).getTime()
    const bTime = new Date(b.updated_at).getTime()
    if (aTime !== bTime) return bTime - aTime

    // 3. Team size (larger teams first)
    return b.team_size - a.team_size
  })
}

// Helper function to get role icon
const getRoleIcon = (roles: string[]) => {
  if (roles.includes('project-lead')) return '👑'
  if (roles.includes('game-designer')) return '🎮'
  if (roles.includes('illustrator')) return '🎨'
  if (roles.includes('writer')) return '✍️'
  if (roles.includes('3d-modeler')) return '🧊'
  if (roles.includes('graphic-designer')) return '🎨'
  if (roles.includes('playtester')) return '🕹️'
  return '🤝'
}

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'idea': return 'var(--color-gray-500)'
    case 'in-development': return 'var(--color-primary)'
    case 'completed': return 'var(--color-success)'
    case 'published': return 'var(--color-purple-500)'
    default: return 'var(--color-gray-500)'
  }
}

export function NotionStyleSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  currentPage
}: NotionStyleSidebarProps) {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: projects = [], isLoading } = useRoleBasedProjects()
  const [showAllProjects, setShowAllProjects] = useState(false)

  const sortedProjects = useMemo(() => {
    if (!user?.id) return []
    return sortProjectsByRelevance(projects, user.id)
  }, [projects, user?.id])

  const visibleProjects = showAllProjects ? sortedProjects : sortedProjects.slice(0, 5)

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('../../lib/supabase')
      await signOut()
      navigate({ to: '/auth' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <aside
      className={`dashboard__sidebar ${sidebarCollapsed ? 'dashboard__sidebar--collapsed' : ''}`}
      role="navigation"
      aria-label="Projects and navigation"
    >
      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__brand">
          <h1 className={sidebarCollapsed ? 'dashboard__brand-title--collapsed' : ''}>
            {sidebarCollapsed ? 'BZ' : 'Budget Zero'}
          </h1>
          {!sidebarCollapsed && user?.email && (
            <p className="dashboard__user-email">
              {user.email}
            </p>
          )}
        </div>
        <button
          className="dashboard__toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="dashboard__nav">
        {/* Marketplace Home Link */}
        <div className="notion-section">
          <Link
            to="/marketplace"
            className={`notion-home-link ${currentPage === 'marketplace' ? 'notion-home-link--active' : ''}`}
            title={sidebarCollapsed ? 'Marketplace' : undefined}
          >
            <span className="notion-icon">🏪</span>
            {!sidebarCollapsed && <span className="notion-label">Marketplace</span>}
          </Link>
        </div>

        {/* Your Projects Section */}
        {!sidebarCollapsed && sortedProjects.length > 0 && (
          <div className="notion-section">
            <div className="notion-section-header">YOUR PROJECTS</div>
            <ul className="notion-project-list" role="list">
              {visibleProjects.map((project) => (
                <li key={project.id} className="notion-project-item">
                  <Link
                    to={`/project/${project.id}`}
                    className={`notion-project-link ${
                      currentPage === 'project' ? 'notion-project-link--active' : ''
                    }`}
                    aria-describedby={`project-meta-${project.id}`}
                  >
                    <div className="notion-project-main">
                      <span className="notion-project-icon">
                        {getRoleIcon(project.my_roles)}
                      </span>
                      <div className="notion-project-info">
                        <span className="notion-project-name">{project.name}</span>
                        <div className="notion-project-meta" id={`project-meta-${project.id}`}>
                          <span className="notion-project-role">
                            {project.my_roles[0]?.replace('-', ' ')}
                          </span>
                          <span className="notion-project-separator">•</span>
                          <span className="notion-project-team">{project.team_size} members</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="notion-project-status"
                      style={{ backgroundColor: getStatusColor(project.status || 'idea') }}
                      title={project.status}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {sortedProjects.length > 5 && (
              <button
                className="notion-toggle-button"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                {showAllProjects ? '▼ Show less' : `▶ Show ${sortedProjects.length - 5} more`}
              </button>
            )}
          </div>
        )}

        {/* Loading state for projects */}
        {!sidebarCollapsed && isLoading && (
          <div className="notion-section">
            <div className="notion-section-header">YOUR PROJECTS</div>
            <div className="notion-loading">Loading projects...</div>
          </div>
        )}

        {/* Empty state for projects */}
        {!sidebarCollapsed && !isLoading && sortedProjects.length === 0 && (
          <div className="notion-section">
            <div className="notion-section-header">YOUR PROJECTS</div>
            <div className="notion-empty-state">
              <p className="notion-empty-text">No projects yet</p>
              <Link to="/marketplace" className="notion-empty-action">
                Discover projects to join
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        <div className="notion-section notion-section--actions">
          {!sidebarCollapsed && <div className="notion-section-header">QUICK ACTIONS</div>}

          <Link
            to="/projects/new"
            className="notion-action-button notion-action-button--primary"
            title={sidebarCollapsed ? 'Start New Project' : undefined}
          >
            <span className="notion-icon">➕</span>
            {!sidebarCollapsed && <span className="notion-label">Start New Project</span>}
          </Link>

          <Link
            to="/profile"
            className={`notion-action-button ${currentPage === 'profile' ? 'notion-action-button--active' : ''}`}
            title={sidebarCollapsed ? 'Your Profile' : undefined}
          >
            <span className="notion-icon">👤</span>
            {!sidebarCollapsed && <span className="notion-label">Your Profile</span>}
          </Link>

          <button
            onClick={handleSignOut}
            className="notion-action-button notion-action-button--secondary"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <span className="notion-icon">🚪</span>
            {!sidebarCollapsed && <span className="notion-label">Sign Out</span>}
          </button>
        </div>
      </nav>
    </aside>
  )
}