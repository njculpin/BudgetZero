import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { GameProjectForm } from '../forms'
import { DashboardLayout } from '../layouts'
import { useAuth } from '../../hooks/useAuth'
import { useRoleBasedProjects } from '../../hooks/useRoleBasedProjects'
import { ProjectWithRoles, ProjectFilter, ProjectSort, ProjectViewMode, ROLE_DESCRIPTIONS } from '../../types/roles'
import './ProjectsPageRoleBased.css'

export function ProjectsPageRoleBased() {
  const { data: projects = [], isLoading, error } = useRoleBasedProjects()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid')
  const [filter, setFilter] = useState<ProjectFilter>({})
  const [sort, setSort] = useState<ProjectSort>('recent_activity')

  const navigate = useNavigate()
  const { data: user } = useAuth()

  // Handle loading and error states
  if (isLoading) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="container">
          <div className="flex justify-center items-center py-8">
            <p>Loading your projects...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="container">
          <Card>
            <CardBody>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <p className="text-destructive">Failed to load projects</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const handleViewProject = (project: ProjectWithRoles) => {
    navigate({ to: `/project/${project.id}` })
  }

  const handleCreateProject = () => {
    setShowProjectForm(true)
  }

  const filteredProjects = projects.filter(project => {
    if (filter.search && !project.name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !project.description.toLowerCase().includes(filter.search.toLowerCase())) {
      return false
    }

    if (filter.roles && filter.roles.length > 0) {
      return filter.roles.some(role => project.my_roles.includes(role))
    }

    if (filter.status && filter.status.length > 0 && !filter.status.includes(project.status)) {
      return false
    }

    return true
  })

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created_date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'team_size':
        return b.team_size - a.team_size
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  const getMyRoleDisplays = (roles: string[]) => {
    return roles.map(role => {
      const roleInfo = ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]
      return roleInfo ? `${roleInfo.icon} ${roleInfo.label}` : role
    }).join(', ')
  }

  return (
    <DashboardLayout currentPage="projects">
      <div className="container">
        {/* Header */}
        <div className="projects-header">
          <div>
            <h1>My Projects</h1>
            <p style={{ color: 'var(--color-gray-600)', margin: '0.5rem 0 0 0' }}>
              All projects where you play a role - from leading to contributing
            </p>
          </div>
          <Button variant="primary" onClick={handleCreateProject}>
            Start New Project
          </Button>
        </div>

        {/* Filters and Controls */}
        <div className="projects-controls">
          <div className="filter-section">
            <input
              type="text"
              placeholder="Search projects..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="search-input"
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ProjectSort)}
              className="sort-select"
            >
              <option value="recent_activity">Recent Activity</option>
              <option value="created_date">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="team_size">Team Size</option>
            </select>
          </div>

          <div className="view-controls">
            <button
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Role Filter Pills */}
        <div className="role-filters">
          <span className="filter-label">Filter by role:</span>
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, info]) => (
            <button
              key={role}
              className={`role-pill ${filter.roles?.includes(role as any) ? 'active' : ''}`}
              onClick={() => {
                const currentRoles = filter.roles || []
                const newRoles = currentRoles.includes(role as any)
                  ? currentRoles.filter(r => r !== role)
                  : [...currentRoles, role as any]
                setFilter(prev => ({ ...prev, roles: newRoles }))
              }}
            >
              {info.icon} {info.label}
            </button>
          ))}
        </div>

        {/* Projects Grid/List */}
        {sortedProjects.length === 0 ? (
          <Card>
            <CardHeader>
              <h3>No Projects Found</h3>
            </CardHeader>
            <CardBody>
              <div className="empty-state">
                <p>
                  {filter.search || filter.roles?.length
                    ? "No projects match your current filters. Try adjusting your search or role filters."
                    : "You're not part of any projects yet. Start by creating a new project or joining an existing one."
                  }
                </p>
                <div className="empty-actions">
                  <Button variant="primary" onClick={handleCreateProject}>
                    Create Project
                  </Button>
                  <Button variant="secondary" onClick={() => navigate({ to: '/discover' })}>
                    Discover Projects
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className={`projects-${viewMode}`}>
            {sortedProjects.map((project) => (
              <div key={project.id} className="project-item">
                <Card className="project-card">
                  <CardBody>
                    <div className="project-info">
                      <div className="project-main">
                        <h3 className="project-title">{project.name}</h3>
                        <p className="project-description">{project.description}</p>

                        <div className="project-meta">
                          {project.is_owner && <span className="ownership-badge">👑 Owner</span>}
                          <span className="project-status">{project.status}</span>
                          <span className="team-size">{project.team_size} members</span>
                          <span className="category">{project.category}</span>
                        </div>
                      </div>

                      <div className="project-roles">
                        <div className="my-roles">
                          <strong>My roles:</strong>
                          <div className="role-badges">
                            {project.my_roles.map(role => {
                              const roleInfo = ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]
                              return (
                                <span key={role} className="role-badge" title={roleInfo?.description}>
                                  {roleInfo?.icon} {roleInfo?.label}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="project-actions">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleViewProject(project)}
                        >
                          Open Project
                        </Button>
                        {project.my_permissions.can_merge_projects && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => console.log('Merge project')}
                          >
                            Merge
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="projects-summary">
          <Card>
            <CardBody>
              <div className="summary-stats">
                <div className="stat">
                  <strong>{projects.length}</strong>
                  <span>Total Projects</span>
                </div>
                <div className="stat">
                  <strong>{projects.filter(p => p.my_roles.includes('project-lead')).length}</strong>
                  <span>Leading</span>
                </div>
                <div className="stat">
                  <strong>{projects.filter(p => p.my_roles.length > 1).length}</strong>
                  <span>Multi-role</span>
                </div>
                <div className="stat">
                  <strong>{projects.reduce((sum, p) => sum + p.team_size, 0)}</strong>
                  <span>Total Team Members</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {showProjectForm && (
        <GameProjectForm
          onClose={() => setShowProjectForm(false)}
          onSuccess={(project) => {
            setShowProjectForm(false)
            navigate({ to: `/projects/${project.id}` })
          }}
        />
      )}
    </DashboardLayout>
  )
}