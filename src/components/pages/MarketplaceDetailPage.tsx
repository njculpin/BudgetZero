import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'
import { useGameProject } from '../../hooks/useGameProjects'
import { useRoleBasedProjects } from '../../hooks/useRoleBasedProjects'
import { useAuth } from '../../hooks/useAuth'
import { useErrorHandler } from '../../contexts/ErrorContext'
import { mergeProjectContent } from '../../lib/supabase'
import type { ProjectWithRoles } from '../../types/roles'

export function MarketplaceDetailPage() {
  const navigate = useNavigate()
  const { projectId } = useParams({ from: '/marketplace/$projectId' })
  const { data: user } = useAuth()
  const { data: project, isLoading, error } = useGameProject(projectId)
  const { data: userProjects = [] } = useRoleBasedProjects()
  const { addError } = useErrorHandler()
  const [showProjectSelector, setShowProjectSelector] = useState<{
    isOpen: boolean
  }>({ isOpen: false })

  if (isLoading) {
    return (
      <DashboardLayout currentPage="marketplace">
        <div className="container">
          <Card>
            <CardBody>
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                Loading project details...
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !project) {
    return (
      <DashboardLayout currentPage="marketplace">
        <div className="container">
          <Card>
            <CardHeader>
              <h3>Project Not Found</h3>
            </CardHeader>
            <CardBody>
              <p style={{ marginBottom: '1.5rem' }}>
                This project could not be found or is no longer available.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate({ to: '/marketplace' })}
              >
                Back to Marketplace
              </Button>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const isOwner = user && project.creator_id === user.id
  const canAddToProject = user && !isOwner

  const handleAddToProject = () => {
    if (!user) {
      addError('Please sign in to add items to your projects', 'error')
      return
    }

    if (userProjects.length === 0) {
      addError('You need to create a project first before adding marketplace items', 'warning')
      navigate({ to: '/projects/new' })
      return
    }

    setShowProjectSelector({ isOpen: true })
  }

  const handleProjectSelection = async (targetProject: ProjectWithRoles) => {
    try {
      await mergeProjectContent(
        targetProject.id,
        project.id,
        'content_merge'
      )

      addError(
        `Successfully added content from "${project.name}" to "${targetProject.name}"`,
        'success'
      )

      setShowProjectSelector({ isOpen: false })
    } catch (error) {
      console.error('Project merge error:', error)
      addError(
        `Failed to add content from "${project.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'board-game': 'Board Game',
      'card-game': 'Card Game',
      'rpg': 'RPG',
      'miniature-game': 'Miniature Game',
      'other': 'Other'
    }
    return labels[category] || category
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'idea': 'var(--color-gray-500)',
      'in-development': 'var(--color-primary)',
      'completed': 'var(--color-success)',
      'published': 'var(--color-success)'
    }
    return colors[status] || 'var(--color-gray-500)'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'idea': 'Idea',
      'in-development': 'In Development',
      'completed': 'Completed',
      'published': 'Published'
    }
    return labels[status] || status
  }

  return (
    <DashboardLayout currentPage="marketplace">
      <div className="container">
        {/* Back Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate({ to: '/marketplace' })}
          >
            ← Back to Marketplace
          </Button>
        </div>

        {/* Project Header */}
        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '1rem' }}>
                  <h1 style={{ margin: 0, fontSize: '2rem' }}>{project.name}</h1>
                  <span style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 'var(--border-radius)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-gray-600)'
                  }}>
                    {getCategoryLabel(project.category)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '1rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: 'var(--font-size-base)',
                    color: getStatusColor(project.status)
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(project.status)
                    }} />
                    {getStatusLabel(project.status)}
                  </span>
                  <span style={{ color: 'var(--color-gray-500)' }}>•</span>
                  <span style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
                    Published {formatDate(project.created_at)}
                  </span>
                </div>
              </div>

              {canAddToProject && (
                <Button
                  variant="primary"
                  onClick={handleAddToProject}
                >
                  ➕ Add to My Project
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Project Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            <Card style={{ marginBottom: '2rem' }}>
              <CardHeader>
                <h2>Description</h2>
              </CardHeader>
              <CardBody>
                <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {project.description || 'No description provided.'}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <h3>Game Details</h3>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                      Players
                    </h4>
                    <p style={{ margin: 0, fontWeight: '500' }}>{project.estimated_players}</p>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                      Playtime
                    </h4>
                    <p style={{ margin: 0, fontWeight: '500' }}>{project.estimated_playtime}</p>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                      Target Audience
                    </h4>
                    <p style={{ margin: 0, fontWeight: '500' }}>{project.target_audience}</p>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                      Category
                    </h4>
                    <p style={{ margin: 0, fontWeight: '500' }}>{getCategoryLabel(project.category)}</p>
                  </div>

                  {project.notes && (
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                        Additional Notes
                      </h4>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', lineHeight: '1.4' }}>{project.notes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Project Selector Modal */}
        {showProjectSelector.isOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '500px', margin: 'var(--spacing-md)' }}>
              <CardHeader>
                <h3>Add to Project</h3>
                <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--font-size-sm)', margin: '0.5rem 0 0 0' }}>
                  Select which project to add "{project.name}" to:
                </p>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {userProjects.map((userProject) => (
                    <button
                      key={userProject.id}
                      onClick={() => handleProjectSelection(userProject)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--spacing-md)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--border-radius)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {userProject.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted-foreground)' }}>
                          Your role: {userProject.my_roles[0]?.replace('-', ' ')} • {userProject.team_size} members
                        </div>
                      </div>
                      <div style={{ color: 'var(--color-primary)' }}>
                        →
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setShowProjectSelector({ isOpen: false })}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate({ to: '/projects/new' })}
                    style={{ flex: 1 }}
                  >
                    Create New Project
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}