import React from 'react'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import type { Milestone } from '../../lib/supabase'

interface MilestoneCardProps {
  milestone: Milestone
  onViewDetails?: (milestone: Milestone) => void
  onEdit?: (milestone: Milestone) => void
  onFund?: (milestone: Milestone) => void
  showOwnerActions?: boolean
}

export function MilestoneCard({
  milestone,
  onViewDetails,
  onEdit,
  onFund,
  showOwnerActions = false
}: MilestoneCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: Milestone['status']) => {
    const colors = {
      'planning': 'var(--color-gray-500)',
      'funding': 'var(--color-warning)',
      'in-progress': 'var(--color-primary)',
      'completed': 'var(--color-success)'
    }
    return colors[status]
  }

  const getStatusLabel = (status: Milestone['status']) => {
    const labels = {
      'planning': 'Planning',
      'funding': 'Seeking Funding',
      'in-progress': 'In Progress',
      'completed': 'Completed'
    }
    return labels[status]
  }

  const getSkillLabel = (skill: string) => {
    const labels: { [key: string]: string } = {
      'game-designer': 'Game Designer',
      'illustrator': 'Illustrator',
      '3d-modeler': '3D Modeler',
      'writer': 'Writer',
      'graphic-designer': 'Graphic Designer',
      'playtester': 'Playtester'
    }
    return labels[skill] || skill
  }

  const fundingProgress = milestone.funding_goal > 0
    ? (milestone.current_funding / milestone.funding_goal) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                {milestone.name}
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '500',
                color: getStatusColor(milestone.status)
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(milestone.status)
                }} />
                {getStatusLabel(milestone.status)}
              </span>
            </div>

            <p style={{
              margin: 0,
              color: 'var(--color-gray-600)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.4',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {milestone.description}
            </p>
          </div>

          {showOwnerActions && (
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              {onEdit && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onEdit(milestone)}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {/* Funding Progress */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>Funding Progress</span>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
              {formatCurrency(milestone.current_funding)} / {formatCurrency(milestone.funding_goal)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--color-gray-200)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(fundingProgress, 100)}%`,
              height: '100%',
              backgroundColor: fundingProgress >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              {fundingProgress.toFixed(0)}% funded
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              {milestone.timeline_weeks} week{milestone.timeline_weeks !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Required Skills */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: '0.5rem' }}>
            Required Skills
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
            {milestone.required_skills.map((skill, index) => (
              <span
                key={index}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '500'
                }}
              >
                {getSkillLabel(skill)}
              </span>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: '0.5rem' }}>
            Deliverables ({milestone.deliverables.length})
          </p>
          <ul style={{
            margin: 0,
            paddingLeft: 'var(--spacing-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)'
          }}>
            {milestone.deliverables.slice(0, 3).map((deliverable, index) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>
                {deliverable}
              </li>
            ))}
            {milestone.deliverables.length > 3 && (
              <li style={{ color: 'var(--color-gray-500)', fontStyle: 'italic' }}>
                +{milestone.deliverables.length - 3} more...
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          paddingTop: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-gray-200)'
        }}>
          {onViewDetails && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onViewDetails(milestone)}
            >
              View Details
            </Button>
          )}
          {onFund && milestone.status === 'funding' && (
            <Button
              variant="primary"
              size="small"
              onClick={() => onFund(milestone)}
            >
              Fund Milestone
            </Button>
          )}
          {milestone.status === 'funding' && !onFund && (
            <Button
              variant="primary"
              size="small"
              onClick={() => console.log('Apply to contribute')}
            >
              Apply to Contribute
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}