import React, { useState } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '../ui'
import { Button } from '../ui'
import { Input } from '../ui'
import { useApplyAsContributor } from '../../hooks/useContributors'
import { useAuth } from '../../hooks/useAuth'
import type { Contributor } from '../../lib/supabase'

interface ContributorApplicationFormProps {
  projectId: string
  milestoneId?: string
  onClose: () => void
  onSuccess?: () => void
}

export function ContributorApplicationForm({
  projectId,
  milestoneId,
  onClose,
  onSuccess
}: ContributorApplicationFormProps) {
  const [formData, setFormData] = useState({
    role: '' as Contributor['role'],
    compensation_type: 'equity' as Contributor['compensation_type'],
    compensation_details: '',
    application_message: '',
    portfolio_links: ['']
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { data: user } = useAuth()
  const applyMutation = useApplyAsContributor()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (!formData.compensation_details.trim()) {
      newErrors.compensation_details = 'Compensation details are required'
    }

    if (!formData.application_message.trim()) {
      newErrors.application_message = 'Application message is required'
    } else if (formData.application_message.length < 50) {
      newErrors.application_message = 'Application message must be at least 50 characters'
    }

    const validLinks = formData.portfolio_links.filter(link => link.trim())
    if (validLinks.length === 0) {
      newErrors.portfolio_links = 'At least one portfolio link is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) return

    try {
      const applicationData = {
        user_id: user.id,
        project_id: projectId,
        milestone_id: milestoneId,
        role: formData.role,
        compensation_type: formData.compensation_type,
        compensation_details: formData.compensation_details.trim(),
        application_message: formData.application_message.trim(),
        portfolio_links: formData.portfolio_links.filter(link => link.trim()),
        status: 'applied' as const,
      }

      await applyMutation.mutateAsync(applicationData)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      setErrors({ form: error.message || 'An error occurred while submitting your application' })
    }
  }

  const addPortfolioLink = () => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: [...prev.portfolio_links, '']
    }))
  }

  const removePortfolioLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index)
    }))
  }

  const updatePortfolioLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.map((link, i) => i === index ? value : link)
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
      <div style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <Card>
          <CardHeader>
            <h2>Apply as Contributor</h2>
            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
              Join this collaborative project and help bring this game to life. Tell us about your skills and what you can contribute.
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

              <div className="input-field">
                <label htmlFor="role" className="input-field__label">
                  Your Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Contributor['role'] }))}
                  className="input"
                  disabled={applyMutation.isPending}
                >
                  <option value="">Select your role...</option>
                  <option value="illustrator">Illustrator</option>
                  <option value="3d-modeler">3D Modeler</option>
                  <option value="writer">Writer</option>
                  <option value="graphic-designer">Graphic Designer</option>
                  <option value="game-designer">Game Designer</option>
                  <option value="playtester">Playtester</option>
                </select>
                {errors.role && (
                  <span className="input-field__error">{errors.role}</span>
                )}
              </div>

              <div className="input-field">
                <label htmlFor="compensation_type" className="input-field__label">
                  Preferred Compensation Type
                </label>
                <select
                  id="compensation_type"
                  value={formData.compensation_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_type: e.target.value as Contributor['compensation_type'] }))}
                  className="input"
                  disabled={applyMutation.isPending}
                >
                  <option value="equity">Equity Share (% of future revenue)</option>
                  <option value="fixed">Fixed Payment</option>
                  <option value="royalty">Royalty (% of sales)</option>
                  <option value="credit">Credit & Portfolio Building</option>
                  <option value="hybrid">Hybrid (Combination)</option>
                </select>
              </div>

              <div className="input-field">
                <label htmlFor="compensation_details" className="input-field__label">
                  Compensation Details
                </label>
                <textarea
                  id="compensation_details"
                  value={formData.compensation_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_details: e.target.value }))}
                  className="input"
                  style={{ minHeight: '80px' }}
                  placeholder="Describe your compensation expectations, rates, or equity percentage..."
                  disabled={applyMutation.isPending}
                />
                {errors.compensation_details && (
                  <span className="input-field__error">{errors.compensation_details}</span>
                )}
              </div>

              <div className="input-field">
                <label htmlFor="application_message" className="input-field__label">
                  Application Message
                </label>
                <textarea
                  id="application_message"
                  value={formData.application_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_message: e.target.value }))}
                  className="input"
                  style={{ minHeight: '120px' }}
                  placeholder="Tell us about your experience, why you're interested in this project, and what unique value you can bring..."
                  disabled={applyMutation.isPending}
                />
                {errors.application_message && (
                  <span className="input-field__error">{errors.application_message}</span>
                )}
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-500)',
                  marginTop: '0.25rem'
                }}>
                  {formData.application_message.length}/50 characters minimum
                </div>
              </div>

              <div className="input-field">
                <label className="input-field__label">
                  Portfolio Links
                </label>
                {formData.portfolio_links.map((link, index) => (
                  <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updatePortfolioLink(index, e.target.value)}
                      className="input"
                      placeholder="https://your-portfolio.com, https://artstation.com/yourname"
                      disabled={applyMutation.isPending}
                    />
                    {formData.portfolio_links.length > 1 && (
                      <Button
                        type="button"
                        variant="error"
                        size="small"
                        onClick={() => removePortfolioLink(index)}
                        disabled={applyMutation.isPending}
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
                  onClick={addPortfolioLink}
                  disabled={applyMutation.isPending}
                >
                  Add Another Link
                </Button>
                {errors.portfolio_links && (
                  <span className="input-field__error">{errors.portfolio_links}</span>
                )}
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={applyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}