import React, { useState } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '../ui'
import { Button } from '../ui'
import { Input } from '../ui'
import { useCreateGameProject } from '../../hooks/useGameProjects'
import { useAuth } from '../../hooks/useAuth'
import type { GameProject } from '../../lib/supabase'

interface GameProjectFormProps {
  onClose: () => void
  onSuccess?: (project: GameProject) => void
}

export function GameProjectForm({ onClose, onSuccess }: GameProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'board-game' as GameProject['category'],
    target_audience: '',
    estimated_players: '',
    estimated_playtime: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { data: user } = useAuth()
  const createProjectMutation = useCreateGameProject()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Game name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 25) {
      newErrors.description = 'Description must be at least 25 characters'
    }

    if (!formData.target_audience.trim()) {
      newErrors.target_audience = 'Target audience is required'
    }

    if (!formData.estimated_players.trim()) {
      newErrors.estimated_players = 'Player count is required'
    }

    if (!formData.estimated_playtime.trim()) {
      newErrors.estimated_playtime = 'Playtime is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user || createProjectMutation.isPending) return

    try {
      const projectData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        target_audience: formData.target_audience.trim(),
        estimated_players: formData.estimated_players.trim(),
        estimated_playtime: formData.estimated_playtime.trim(),
        creator_id: user.id,
        status: 'idea' as const,
      }

      const project = await createProjectMutation.mutateAsync(projectData)
      onSuccess?.(project)
      onClose()
    } catch (error: any) {
      setErrors({ form: error.message || 'An error occurred while creating the project' })
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
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
      zIndex: 1000,
      padding: 'var(--spacing-md)'
    }}>
      <div style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <Card>
          <CardHeader>
            <h2>Create New Game Project</h2>
            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
              Start your collaborative tabletop game development journey. This will be the foundation for your milestone-driven project.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              {errors.form && (
                <div style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: '#fef2f2',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--color-error)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {errors.form}
                </div>
              )}

              <Input
                label="Game Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="e.g., Mystic Realms, Space Traders, Dragon's Quest"
                disabled={createProjectMutation.isPending}
              />

              <div className="input-field">
                <label htmlFor="category" className="input-field__label">
                  Game Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="input"
                  disabled={createProjectMutation.isPending}
                >
                  <option value="board-game">Board Game</option>
                  <option value="card-game">Card Game</option>
                  <option value="rpg">RPG / Tabletop RPG</option>
                  <option value="miniature-game">Miniature Game</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="input-field">
                <label htmlFor="description" className="input-field__label">
                  Game Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="Describe your game concept, core mechanics, theme, and what makes it unique. This will help attract the right contributors..."
                  disabled={createProjectMutation.isPending}
                />
                {errors.description && (
                  <span className="input-field__error">{errors.description}</span>
                )}
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-500)',
                  marginTop: '0.25rem'
                }}>
                  {formData.description.length}/50 characters minimum
                </div>
              </div>

              <Input
                label="Target Audience"
                value={formData.target_audience}
                onChange={(e) => handleInputChange('target_audience', e.target.value)}
                error={errors.target_audience}
                placeholder="e.g., Families with children 8+, Strategy gamers, D&D enthusiasts"
                disabled={createProjectMutation.isPending}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <Input
                  label="Player Count"
                  value={formData.estimated_players}
                  onChange={(e) => handleInputChange('estimated_players', e.target.value)}
                  error={errors.estimated_players}
                  placeholder="e.g., 2-4 players, 1-6 players"
                  disabled={createProjectMutation.isPending}
                />

                <Input
                  label="Estimated Playtime"
                  value={formData.estimated_playtime}
                  onChange={(e) => handleInputChange('estimated_playtime', e.target.value)}
                  error={errors.estimated_playtime}
                  placeholder="e.g., 30-45 minutes, 2-3 hours"
                  disabled={createProjectMutation.isPending}
                />
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}