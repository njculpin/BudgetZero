import { useState } from 'react'
import { Card, CardBody } from '../ui'
import { Button } from '../ui/Button'
import { ValidatedForm, ValidatedInput } from '../ui/ValidatedForm'
import { z } from 'zod'
import { useMyCreatorProfile, useUpdateCreatorProfile } from '../../hooks/useCreatorProfile'
import { useOnboardingFlow } from '../../hooks/useOnboardingAnalytics'
import { useAuth } from '../../hooks/useAuth'
import './ProfileCompletionPrompt.css'

interface ProfileCompletionPromptProps {
  field: 'specialties' | 'availability_status' | 'portfolio_links' | 'bio' | 'experience_level'
  context: string
  onComplete?: () => void
  onDismiss?: () => void
}

// Field-specific schemas and components
const SpecialtiesSchema = z.object({
  specialties: z.array(z.string()).min(1, 'Select at least one specialty').max(5),
})

const AvailabilitySchema = z.object({
  availability_status: z.enum(['available', 'limited', 'unavailable']),
  rate_range: z.string().max(50).optional(),
})


function SpecialtiesPrompt({ onComplete, onDismiss }: { onComplete?: () => void; onDismiss?: () => void }) {
  const specialtyOptions = [
    'Board Games', 'Card Games', 'RPGs', 'Miniature Games', 'Party Games',
    'Strategy Games', 'Cooperative Games', 'Deck Building', 'Worker Placement',
    'Area Control', 'Social Deduction', 'Abstract Games'
  ]

  const { data: user } = useAuth()
  const { mutateAsync: updateProfile } = useUpdateCreatorProfile()
  const { trackProfileFieldCompleted } = useOnboardingFlow()

  const handleSubmit = async (data: any) => {
    await updateProfile({ specialties: data.specialties })
    trackProfileFieldCompleted(user?.id, 'specialties', 'progressive_disclosure')
    onComplete?.()
  }

  return (
    <ValidatedForm
      schema={SpecialtiesSchema}
      onSubmit={handleSubmit}
      initialData={{ specialties: [] }}
    >
      {({ values, errors, isSubmitting, setValue }) => (
        <>
          <div className="profile-prompt__section">
            <label className="profile-prompt__label">Game Types You're Interested In</label>
            <p className="profile-prompt__help">Select up to 5 game types to help others find you for relevant projects</p>
            <div className="profile-prompt__specialties-grid">
              {specialtyOptions.map((specialty) => {
                const isSelected = values.specialties?.includes(specialty)
                const canSelect = !isSelected && (values.specialties?.length || 0) < 5

                return (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => {
                      const current = values.specialties || []
                      if (isSelected) {
                        setValue('specialties', current.filter(s => s !== specialty))
                      } else if (canSelect) {
                        setValue('specialties', [...current, specialty])
                      }
                    }}
                    disabled={!isSelected && !canSelect}
                    className={`profile-prompt__specialty-tag ${isSelected ? 'profile-prompt__specialty-tag--selected' : ''} ${!canSelect && !isSelected ? 'profile-prompt__specialty-tag--disabled' : ''}`}
                  >
                    {specialty}
                  </button>
                )
              })}
            </div>
            {errors.specialties && <div className="error-text">{errors.specialties}</div>}
          </div>

          <div className="profile-prompt__actions">
            {onDismiss && (
              <Button type="button" variant="secondary" onClick={onDismiss}>
                Skip for Now
              </Button>
            )}
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Profile
            </Button>
          </div>
        </>
      )}
    </ValidatedForm>
  )
}

function AvailabilityPrompt({ onComplete, onDismiss }: { onComplete?: () => void; onDismiss?: () => void }) {
  const availabilityOptions = [
    { value: 'available', label: 'Available', description: 'Ready to collaborate on projects' },
    { value: 'limited', label: 'Limited Availability', description: 'Can take on select projects' },
    { value: 'unavailable', label: 'Not Available', description: 'Just browsing for now' },
  ]

  const { data: user } = useAuth()
  const { mutateAsync: updateProfile } = useUpdateCreatorProfile()
  const { trackProfileFieldCompleted } = useOnboardingFlow()

  const handleSubmit = async (data: any) => {
    await updateProfile({
      availability_status: data.availability_status,
      rate_range: data.rate_range
    })
    trackProfileFieldCompleted(user?.id, 'availability_status', 'progressive_disclosure')
    onComplete?.()
  }

  return (
    <ValidatedForm
      schema={AvailabilitySchema}
      onSubmit={handleSubmit}
      initialData={{ availability_status: undefined, rate_range: '' }}
    >
      {({ values, errors, isSubmitting, setValue }) => (
        <>
          <div className="profile-prompt__section">
            <label className="profile-prompt__label">Current Availability</label>
            <div className="profile-prompt__availability-grid">
              {availabilityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('availability_status', option.value)}
                  className={`profile-prompt__availability-card ${values.availability_status === option.value ? 'profile-prompt__availability-card--selected' : ''}`}
                >
                  <h4 className="profile-prompt__availability-card__title">{option.label}</h4>
                  <p className="profile-prompt__availability-card__description">{option.description}</p>
                </button>
              ))}
            </div>
            {errors.availability_status && <div className="error-text">{errors.availability_status}</div>}
          </div>

          {values.availability_status !== 'unavailable' && (
            <ValidatedInput
              label="Rate Range (Optional)"
              name="rate_range"
              value={values.rate_range || ''}
              error={errors.rate_range}
              onChange={(value) => setValue('rate_range', value)}
              placeholder="e.g., $50-75/hour, $500-1000/project"
            />
          )}

          <div className="profile-prompt__actions">
            {onDismiss && (
              <Button type="button" variant="secondary" onClick={onDismiss}>
                Skip for Now
              </Button>
            )}
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Profile
            </Button>
          </div>
        </>
      )}
    </ValidatedForm>
  )
}

export function ProfileCompletionPrompt({ field, context, onComplete, onDismiss }: ProfileCompletionPromptProps) {
  const { data: profile } = useMyCreatorProfile()
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if field is already completed or prompt was dismissed
  if (!profile || isDismissed) return null

  const isFieldIncomplete = () => {
    switch (field) {
      case 'specialties':
        return !profile.specialties || profile.specialties.length === 0
      case 'availability_status':
        return profile.availability_status === 'available' // Default value suggests incomplete
      case 'portfolio_links':
        return !profile.portfolio_links || profile.portfolio_links.length === 0
      case 'bio':
        return !profile.bio || profile.bio.length === 0
      case 'experience_level':
        return profile.experience_level === 'intermediate' // Default value suggests incomplete
      default:
        return false
    }
  }

  if (!isFieldIncomplete()) return null

  const handleComplete = () => {
    onComplete?.()
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    onDismiss?.()
    setIsDismissed(true)
  }

  const getTitle = () => {
    switch (field) {
      case 'specialties':
        return 'Help Others Find You'
      case 'availability_status':
        return 'Set Your Availability'
      case 'portfolio_links':
        return 'Show Your Work'
      case 'bio':
        return 'Tell Your Story'
      case 'experience_level':
        return 'Share Your Experience'
      default:
        return 'Complete Your Profile'
    }
  }

  const getDescription = () => {
    return `Since you're ${context}, let us know more about yourself to improve collaboration opportunities.`
  }

  const renderFieldContent = () => {
    switch (field) {
      case 'specialties':
        return <SpecialtiesPrompt onComplete={handleComplete} onDismiss={handleDismiss} />
      case 'availability_status':
        return <AvailabilityPrompt onComplete={handleComplete} onDismiss={handleDismiss} />
      default:
        return null
    }
  }

  return (
    <Card className="profile-completion-prompt">
      <CardBody>
        <div className="profile-completion-prompt__header">
          <h3 className="profile-completion-prompt__title">{getTitle()}</h3>
          <p className="profile-completion-prompt__description">{getDescription()}</p>
        </div>

        <div className="profile-completion-prompt__content">
          {renderFieldContent()}
        </div>
      </CardBody>
    </Card>
  )
}