import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { MilestoneCard } from '../features'
import { MilestoneForm } from '../forms'
import { ContributorApplicationForm } from '../forms'
import { RulebookEditor } from '../features'
import { DashboardLayout } from '../layouts'
import { useAuth } from '../../hooks/useAuth'
import { useErrorHandler } from '../../contexts/ErrorContext'
import { useGameProject } from '../../hooks/useGameProjects'
import { useMilestones } from '../../hooks/useMilestones'
import { useContributors } from '../../hooks/useContributors'

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: '/project/$projectId' })
  const navigate = useNavigate()
  const { data: user } = useAuth()

  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'milestones' | 'rulebook'>('milestones')

  // Get project data - with explicit enabled condition
  const { data: project, isLoading: isProjectLoading, error: projectError } = useGameProject(projectId)

  // Get milestones and contributors - only if we have a valid projectId
  const { data: milestones, refetch: refetchMilestones } = useMilestones(projectId)
  const { data: contributors } = useContributors(projectId)

  const isOwner = user?.id === project?.creator_id
  const hasApplied = contributors?.some(c => c.user_id === user?.id)

  // Handle error state using ErrorContext
  if (projectError) {
    const { addError } = useErrorHandler()
    addError(
      `Failed to load project: ${projectError.message}`,
      'error',
      {
        label: 'Back to Projects',
        handler: () => navigate({ to: '/projects' })
      }
    )
    return (
      <DashboardLayout currentPage="projects">
        <div className="container">
          <Card>
            <CardBody>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <p className="text-destructive">Unable to load project</p>
                <Button variant="primary" onClick={() => navigate({ to: '/projects' })}>
                  Back to Projects
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (isProjectLoading) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="container">
          <Card>
            <CardBody>
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p>Loading project...</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="container">
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
      </DashboardLayout>
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


  return (
    <DashboardLayout currentPage="projects">
      <div className="container">
        <div className="mb-8">
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate({ to: '/projects' })}
            className="mb-4"
          >
            ← Back to Projects
          </Button>

          <div className="flex justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="m-0 text-primary text-xl">📋 {project.name} - Project Details</h1>
                <span className="badge badge--gray">
                  {getCategoryLabel(project.category)}
                </span>
                <span className={`status-badge status-badge--${project.status}`}>
                  <div className="status-badge__dot" />
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                </span>
              </div>
              <p className="text-gray-600 text-base mb-4">
                {project.description}
              </p>
              <div className="flex gap-6 text-sm text-gray-600">
                <span><strong>Players:</strong> {project.estimated_players}</span>
                <span><strong>Playtime:</strong> {project.estimated_playtime}</span>
                <span><strong>Audience:</strong> {project.target_audience}</span>
              </div>
            </div>

            <div className="flex gap-2">
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
        <div className="tab-nav">
          <div className="tab-nav__list">
            <button
              onClick={() => setActiveTab('milestones')}
              className={`tab-nav__button ${activeTab === 'milestones' ? 'tab-nav__button--active' : ''}`}
            >
              Milestones
            </button>
            <button
              onClick={() => setActiveTab('rulebook')}
              className={`tab-nav__button ${activeTab === 'rulebook' ? 'tab-nav__button--active' : ''}`}
            >
              Rulebook
            </button>
          </div>
        </div>

        {/* Milestones Section */}
        {activeTab === 'milestones' && (
          <div>
            <h2 className="mb-6">Project Milestones</h2>

            {milestones && milestones.length > 0 ? (
              <div className="grid grid-auto-fill-400 gap-6">
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
                  <div className="text-center p-8">
                    <p className="text-gray-600 mb-6">
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
            <h2 className="mb-6">Game Rulebook</h2>
            <Card>
              <CardBody className="p-0">
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
          <div className="mt-12">
            <h2 className="mb-6">Contributors ({contributors.length})</h2>
            <div className="grid grid-auto-fill-250 gap-4">
              {contributors.map((contributor) => (
                <Card key={contributor.id}>
                  <CardBody>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="m-0 text-base">
                        {contributor.role.charAt(0).toUpperCase() + contributor.role.slice(1).replace('-', ' ')}
                      </h4>
                      <span className={`badge ${contributor.status === 'accepted' ? 'badge--success' : 'badge--warning'}`}>
                        {contributor.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 m-0">
                      {contributor.compensation_type.charAt(0).toUpperCase() + contributor.compensation_type.slice(1)} compensation
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

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
    </DashboardLayout>
  )
}