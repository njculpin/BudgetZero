import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'
import { useGameProjects } from '../../hooks/useGameProjects'
import { useRoleBasedProjects } from '../../hooks/useRoleBasedProjects'
import { useAuth } from '../../hooks/useAuth'
import { useErrorHandler } from '../../contexts/ErrorContext'
import { GameProjectCard } from '../features'
import type { GameProject } from '../../lib/supabase'
import { mergeProjectContent } from '../../lib/supabase'
import type { ProjectWithRoles } from '../../types/roles'

export function MarketplacePage() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: publishedProjects, isLoading } = useGameProjects()
  const { data: userProjects = [] } = useRoleBasedProjects()
  const { addError } = useErrorHandler()
  const [showProjectSelector, setShowProjectSelector] = useState<{
    isOpen: boolean
    selectedMarketplaceProject?: GameProject
  }>({ isOpen: false })

  // Filter only published/completed projects for the marketplace
  const marketplaceProjects = publishedProjects?.filter(
    project => project.status === 'published' || project.status === 'completed'
  ) || []

  // Handle adding marketplace item to user's project
  const handleAddToProject = (marketplaceProject: GameProject) => {
    if (!user) {
      addError('Please sign in to add items to your projects', 'error')
      return
    }

    if (userProjects.length === 0) {
      addError('You need to create a project first before adding marketplace items', 'warning')
      navigate({ to: '/projects/new' })
      return
    }

    // Open project selector modal
    setShowProjectSelector({
      isOpen: true,
      selectedMarketplaceProject: marketplaceProject
    })
  }

  // Handle requesting to add to project (for items requiring permission)
  const handleRequestToAdd = (marketplaceProject: GameProject) => {
    if (!user) {
      addError('Please sign in to request collaboration', 'error')
      return
    }

    // TODO: Implement collaboration request system
    addError(`Collaboration request sent for "${marketplaceProject.name}"`, 'success')
  }

  // Handle project selection for adding marketplace item
  const handleProjectSelection = async (targetProject: ProjectWithRoles) => {
    if (!showProjectSelector.selectedMarketplaceProject) return

    try {
      // Perform the actual project merging
      await mergeProjectContent(
        targetProject.id,
        showProjectSelector.selectedMarketplaceProject.id,
        'content_merge'
      )

      addError(
        `Successfully added content from "${showProjectSelector.selectedMarketplaceProject.name}" to "${targetProject.name}"`,
        'success'
      )

      setShowProjectSelector({ isOpen: false })
    } catch (error) {
      console.error('Project merge error:', error)
      addError(
        `Failed to add content from "${showProjectSelector.selectedMarketplaceProject.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    }
  }

  return (
    <DashboardLayout currentPage="marketplace">
      <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1>Digital Marketplace</h1>
              <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
                Discover and purchase completed tabletop games from our creative community
              </p>
            </div>
          </div>

          {/* Marketplace Categories */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <Button variant="primary" size="small">All Games</Button>
            <Button variant="secondary" size="small">Board Games</Button>
            <Button variant="secondary" size="small">Card Games</Button>
            <Button variant="secondary" size="small">RPGs</Button>
            <Button variant="secondary" size="small">Miniature Games</Button>
            <Button variant="secondary" size="small">Print & Play</Button>
            <Button variant="secondary" size="small">3D Models</Button>
          </div>

          {isLoading ? (
            <Card>
              <CardBody>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  Loading marketplace...
                </div>
              </CardBody>
            </Card>
          ) : marketplaceProjects.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {marketplaceProjects.map((project) => {
                // Determine if user can directly add or needs to request
                const isOwner = user && project.creator_id === user.id
                const canDirectlyAdd = user && !isOwner
                const shouldShowRequestOption = false // TODO: Implement when collaboration system is ready

                return (
                  <GameProjectCard
                    key={project.id}
                    project={project}
                    onView={(project) => navigate({ to: `/marketplace/${project.id}` })}
                    onAddToProject={canDirectlyAdd ? handleAddToProject : undefined}
                    onRequestToAdd={shouldShowRequestOption ? handleRequestToAdd : undefined}
                    showOwnerActions={false}
                    showCollaborationActions={!!user && !isOwner}
                    mode="marketplace"
                  />
                )
              })}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <h3>No Published Games Yet</h3>
              </CardHeader>
              <CardBody>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
                    The marketplace is just getting started! Be among the first creators to publish your completed games and start selling to our community.
                  </p>
                  <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem', fontSize: 'var(--font-size-sm)' }}>
                    Coming soon to the marketplace:
                  </p>
                  <ul style={{
                    textAlign: 'left',
                    display: 'inline-block',
                    color: 'var(--color-gray-600)',
                    fontSize: 'var(--font-size-sm)',
                    marginBottom: '2rem'
                  }}>
                    <li>Complete rulebook PDFs ready for printing</li>
                    <li>Print-and-play game files in multiple formats</li>
                    <li>3D printable miniatures and game components</li>
                    <li>Card deck PDFs optimized for professional printing</li>
                    <li>Digital companion apps and tools</li>
                  </ul>
                  <Button
                    variant="primary"
                    onClick={() => navigate({ to: '/projects' })}
                  >
                    Create Your First Game
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

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
                  Select which project to add "{showProjectSelector.selectedMarketplaceProject?.name}" to:
                </p>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {userProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelection(project)}
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
                          {project.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted-foreground)' }}>
                          Your role: {project.my_roles[0]?.replace('-', ' ')} • {project.team_size} members
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