import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { MilestoneCard } from '../features'
import { MilestoneForm } from '../forms'
import { ContributorApplicationForm } from '../forms'
import { RulebookEditor } from '../features'
import { useAuth } from '../../hooks/useAuth'
import { useGameProjects } from '../../hooks/useGameProjects'
import { useMilestones } from '../../hooks/useMilestones'
import { useContributors } from '../../hooks/useContributors'

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  const navigate = useNavigate()
  const { data: user } = useAuth()

  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'milestones' | 'rulebook'>('milestones')

  // Get project data
  const { data: allProjects } = useGameProjects()
  const project = allProjects?.find(p => p.id === projectId)

  // Get milestones and contributors
  const { data: milestones, refetch: refetchMilestones } = useMilestones(projectId)
  const { data: contributors } = useContributors(projectId)

  const isOwner = user?.id === project?.creator_id
  const hasApplied = contributors?.some(c => c.user_id === user?.id)

  if (!project) {
    return (
      <div className="app">
        <div className="container" style={{ paddingTop: '4rem' }}>
          <Card>
            <CardBody>
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p>Project not found</p>
                <Button variant="primary" onClick={() => navigate({ to: '/projects' })}>
                  Back to Projects
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'board-game': 'Board Game',
      'card-game': 'Card Game',
      'rpg': 'RPG',
      'miniature-game': 'Miniature Game',
      'other': 'Other'
    }
    return labels[category] || category
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'idea': 'var(--color-gray-500)',
      'in-development': 'var(--color-primary)',
      'completed': 'var(--color-success)',
      'published': 'var(--color-success)'
    }
    return colors[status] || 'var(--color-gray-500)'
  }

  return (
    <div className="dashboard">
      <main className="dashboard__main">
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => navigate({ to: '/projects' })}
              style={{ marginBottom: '1rem' }}
            >
              ← Back to Projects
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-lg)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '0.5rem' }}>
                  <h1 style={{ margin: 0 }}>{project.name}</h1>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-gray-600)'
                  }}>
                    {getCategoryLabel(project.category)}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: getStatusColor(project.status)
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(project.status)
                    }} />
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
                <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-base)', marginBottom: '1rem' }}>
                  {project.description}
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                  <span><strong>Players:</strong> {project.estimated_players}</span>
                  <span><strong>Playtime:</strong> {project.estimated_playtime}</span>
                  <span><strong>Audience:</strong> {project.target_audience}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                {isOwner && (
                  <Button
                    variant="primary"
                    onClick={() => setShowMilestoneForm(true)}
                  >
                    Add Milestone
                  </Button>
                )}
                {!isOwner && !hasApplied && (
                  <Button
                    variant="primary"
                    onClick={() => setShowApplicationForm(true)}
                  >
                    Apply as Contributor
                  </Button>
                )}
                {hasApplied && (
                  <Button variant="secondary" disabled>
                    Application Submitted
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{
            borderBottom: '1px solid var(--color-gray-200)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button
                onClick={() => setActiveTab('milestones')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--spacing-md) 0',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  color: activeTab === 'milestones' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                  borderBottom: activeTab === 'milestones' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
              >
                Milestones
              </button>
              <button
                onClick={() => setActiveTab('rulebook')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--spacing-md) 0',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  color: activeTab === 'rulebook' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                  borderBottom: activeTab === 'rulebook' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
              >
                Rulebook
              </button>
            </div>
          </div>

          {/* Milestones Section */}
          {activeTab === 'milestones' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Project Milestones</h2>

            {milestones && milestones.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: 'var(--spacing-lg)'
              }}>
                {milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onViewDetails={(milestone) => console.log('View milestone:', milestone)}
                    onEdit={isOwner ? (milestone) => console.log('Edit milestone:', milestone) : undefined}
                    onFund={!isOwner ? (milestone) => console.log('Fund milestone:', milestone) : undefined}
                    showOwnerActions={isOwner}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <h3>No Milestones Yet</h3>
                </CardHeader>
                <CardBody>
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
                      {isOwner
                        ? "This project doesn't have any milestones yet. Create your first milestone to start attracting contributors and funding."
                        : "This project doesn't have any milestones yet. Check back later as the creator develops their roadmap."
                      }
                    </p>
                    {isOwner && (
                      <Button
                        variant="primary"
                        onClick={() => setShowMilestoneForm(true)}
                      >
                        Create First Milestone
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
            </div>
          )}

          {/* Rulebook Section */}
          {activeTab === 'rulebook' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Game Rulebook</h2>
              <Card>
                <CardBody style={{ padding: 0 }}>
                  <RulebookEditor
                    projectId={projectId}
                    gameCategory={project?.category}
                    editable={isOwner}
                    onUpdate={(content) => {
                      console.log('Rulebook updated:', content)
                    }}
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {/* Contributors Section */}
          {contributors && contributors.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Contributors ({contributors.length})</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 'var(--spacing-md)'
              }}>
                {contributors.map((contributor) => (
                  <Card key={contributor.id}>
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>
                          {contributor.role.charAt(0).toUpperCase() + contributor.role.slice(1).replace('-', ' ')}
                        </h4>
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          backgroundColor: contributor.status === 'accepted' ? 'var(--color-success)' : 'var(--color-warning)',
                          color: 'white',
                          borderRadius: 'var(--border-radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '500'
                        }}>
                          {contributor.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', margin: 0 }}>
                        {contributor.compensation_type.charAt(0).toUpperCase() + contributor.compensation_type.slice(1)} compensation
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showMilestoneForm && (
        <MilestoneForm
          projectId={projectId}
          onClose={() => setShowMilestoneForm(false)}
          onSuccess={() => {
            refetchMilestones()
          }}
        />
      )}

      {showApplicationForm && (
        <ContributorApplicationForm
          projectId={projectId}
          onClose={() => setShowApplicationForm(false)}
          onSuccess={() => {
            setShowApplicationForm(false)
            // Could refetch contributors here
          }}
        />
      )}
    </div>
  )
}