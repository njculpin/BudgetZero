import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import type { GameProject } from '../../lib/supabase'

interface GameProjectCardProps {
  project: GameProject
  onEdit?: (project: GameProject) => void
  onView?: (project: GameProject) => void
  onDelete?: (project: GameProject) => void
  showOwnerActions?: boolean
}

export function GameProjectCard({
  project,
  onEdit,
  onView,
  onDelete,
  showOwnerActions = false
}: GameProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryLabel = (category: GameProject['category']) => {
    const labels = {
      'board-game': 'Board Game',
      'card-game': 'Card Game',
      'rpg': 'RPG',
      'miniature-game': 'Miniature Game',
      'other': 'Other'
    }
    return labels[category]
  }

  const getStatusColor = (status: GameProject['status']) => {
    const colors = {
      'idea': 'var(--color-gray-500)',
      'in-development': 'var(--color-primary)',
      'completed': 'var(--color-success)',
      'published': 'var(--color-success)'
    }
    return colors[status]
  }

  const getStatusLabel = (status: GameProject['status']) => {
    const labels = {
      'idea': 'Idea',
      'in-development': 'In Development',
      'completed': 'Completed',
      'published': 'Published'
    }
    return labels[status]
  }

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }} id={`project-${project.id}-title`}>
                {project.name}
              </h3>
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '500',
                color: 'var(--color-gray-600)'
              }} aria-label={`Category: ${getCategoryLabel(project.category)}`}>
                {getCategoryLabel(project.category)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '0.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: 'var(--font-size-sm)',
                color: getStatusColor(project.status)
              }} aria-label={`Status: ${getStatusLabel(project.status)}`}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(project.status)
                }} aria-hidden="true" />
                {getStatusLabel(project.status)}
              </span>
            </div>

            <p style={{
              margin: 0,
              color: 'var(--color-gray-600)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.4',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}>
              {project.description}
            </p>
          </div>

          {showOwnerActions && (
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              {onEdit && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onEdit(project)}
                  aria-label={`Edit ${project.name} project`}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="error"
                  size="small"
                  onClick={() => onDelete(project)}
                  aria-label={`Delete ${project.name} project`}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)'
        }}>
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', margin: '0 0 0.25rem 0' }}>
              Players
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', margin: 0 }}>
              {project.estimated_players}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', margin: '0 0 0.25rem 0' }}>
              Playtime
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', margin: 0 }}>
              {project.estimated_playtime}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', margin: '0 0 0.25rem 0' }}>
              Target Audience
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', margin: 0 }}>
              {project.target_audience}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-gray-200)'
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-500)',
            margin: 0
          }}>
            Created {formatDate(project.created_at)}
          </p>

          {onView && (
            <Button
              variant="primary"
              size="small"
              onClick={() => onView(project)}
              aria-label={`View ${project.name} project details`}
            >
              View Project
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}