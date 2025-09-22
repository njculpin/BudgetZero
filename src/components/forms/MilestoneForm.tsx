import React, { useState } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '../ui'
import { Button } from '../ui'
import { Input } from '../ui'
import { useCreateMilestone } from '../../hooks/useMilestones'
import type { Milestone } from '../../lib/supabase'

interface MilestoneFormProps {
  projectId: string
  onClose: () => void
  onSuccess?: (milestone: Milestone) => void
}

export function MilestoneForm({ projectId, onClose, onSuccess }: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    funding_goal: '',
    timeline_weeks: '',
    deliverables: [''],
    required_skills: ['']
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const createMilestoneMutation = useCreateMilestone()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Milestone name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.funding_goal || isNaN(Number(formData.funding_goal)) || Number(formData.funding_goal) < 0) {
      newErrors.funding_goal = 'Valid funding goal is required'
    }

    if (!formData.timeline_weeks || isNaN(Number(formData.timeline_weeks)) || Number(formData.timeline_weeks) <= 0) {
      newErrors.timeline_weeks = 'Valid timeline in weeks is required'
    }

    const validDeliverables = formData.deliverables.filter(d => d.trim())
    if (validDeliverables.length === 0) {
      newErrors.deliverables = 'At least one deliverable is required'
    }

    const validSkills = formData.required_skills.filter(s => s.trim())
    if (validSkills.length === 0) {
      newErrors.required_skills = 'At least one required skill is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const milestoneData = {
        project_id: projectId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        funding_goal: Number(formData.funding_goal),
        current_funding: 0,
        timeline_weeks: Number(formData.timeline_weeks),
        deliverables: formData.deliverables.filter(d => d.trim()),
        required_skills: formData.required_skills.filter(s => s.trim()),
        status: 'planning' as const,
      }

      const milestone = await createMilestoneMutation.mutateAsync(milestoneData)
      onSuccess?.(milestone)
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the milestone'
      setErrors({ form: errorMessage })
    }
  }

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, '']
    }))
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const updateDeliverable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) => i === index ? value : item)
    }))
  }

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      required_skills: [...prev.required_skills, '']
    }))
  }

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }))
  }

  const updateSkill = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.map((item, i) => i === index ? value : item)
    }))
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
      <div style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <Card>
          <CardHeader>
            <h2>Create New Milestone</h2>
            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
              Define a milestone with specific goals, deliverables, and funding requirements to move your project forward.
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
                label="Milestone Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={errors.name}
                placeholder="e.g., Core Mechanics Design, Art Assets Creation"
                disabled={createMilestoneMutation.isPending}
              />

              <div className="input-field">
                <label htmlFor="description" className="input-field__label">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  style={{ minHeight: '100px' }}
                  placeholder="Describe what this milestone will accomplish and its importance to the project..."
                  disabled={createMilestoneMutation.isPending}
                />
                {errors.description && (
                  <span className="input-field__error">{errors.description}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <Input
                  label="Funding Goal ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.funding_goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, funding_goal: e.target.value }))}
                  error={errors.funding_goal}
                  placeholder="0.00"
                  disabled={createMilestoneMutation.isPending}
                />

                <Input
                  label="Timeline (weeks)"
                  type="number"
                  min="1"
                  value={formData.timeline_weeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline_weeks: e.target.value }))}
                  error={errors.timeline_weeks}
                  placeholder="4"
                  disabled={createMilestoneMutation.isPending}
                />
              </div>

              <div className="input-field">
                <label className="input-field__label">
                  Deliverables
                </label>
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <input
                      type="text"
                      value={deliverable}
                      onChange={(e) => updateDeliverable(index, e.target.value)}
                      className="input"
                      placeholder="e.g., Complete game rules document, 20 character illustrations"
                      disabled={createMilestoneMutation.isPending}
                    />
                    {formData.deliverables.length > 1 && (
                      <Button
                        type="button"
                        variant="error"
                        size="small"
                        onClick={() => removeDeliverable(index)}
                        disabled={createMilestoneMutation.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={addDeliverable}
                  disabled={createMilestoneMutation.isPending}
                >
                  Add Deliverable
                </Button>
                {errors.deliverables && (
                  <span className="input-field__error">{errors.deliverables}</span>
                )}
              </div>

              <div className="input-field">
                <label className="input-field__label">
                  Required Skills
                </label>
                {formData.required_skills.map((skill, index) => (
                  <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <select
                      value={skill}
                      onChange={(e) => updateSkill(index, e.target.value)}
                      className="input"
                      disabled={createMilestoneMutation.isPending}
                    >
                      <option value="">Select a skill...</option>
                      <option value="game-designer">Game Designer</option>
                      <option value="illustrator">Illustrator</option>
                      <option value="3d-modeler">3D Modeler</option>
                      <option value="writer">Writer</option>
                      <option value="graphic-designer">Graphic Designer</option>
                      <option value="playtester">Playtester</option>
                    </select>
                    {formData.required_skills.length > 1 && (
                      <Button
                        type="button"
                        variant="error"
                        size="small"
                        onClick={() => removeSkill(index)}
                        disabled={createMilestoneMutation.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={addSkill}
                  disabled={createMilestoneMutation.isPending}
                >
                  Add Required Skill
                </Button>
                {errors.required_skills && (
                  <span className="input-field__error">{errors.required_skills}</span>
                )}
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={createMilestoneMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={createMilestoneMutation.isPending}
              >
                {createMilestoneMutation.isPending ? 'Creating...' : 'Create Milestone'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}