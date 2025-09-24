import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardBody } from '../ui'
import { Button } from '../ui/Button'
import { ValidatedForm, ValidatedInput, ValidatedTextarea } from '../ui/ValidatedForm'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { ResponsiveContainer } from '../layouts/ResponsiveContainer'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { useOnboardingFlow } from '../../hooks/useOnboardingAnalytics'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/supabase'
import './UserOnboarding.css'

type CreatorProfileInsert = Database['public']['Tables']['creator_profiles']['Insert']

interface OnboardingStepProps {
  onNext: (data?: any) => void
  onPrevious: () => void
  onSkip?: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

// Minimal onboarding validation schema
const MinimalOnboardingSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  role: z.enum(['game-designer', 'illustrator', '3d-modeler', 'writer', 'graphic-designer', 'playtester']),
  bio: z.string().max(100, 'Brief description must be less than 100 characters').optional(),
})

// Minimal Onboarding Step - Single step collecting essential data
function MinimalOnboardingStep({ onNext }: OnboardingStepProps) {
  const roleOptions = [
    { value: 'game-designer', label: 'Game Designer', description: 'Create mechanics, rules, and gameplay systems' },
    { value: 'illustrator', label: 'Illustrator', description: 'Create artwork, characters, and visual assets' },
    { value: '3d-modeler', label: '3D Modeler', description: 'Design miniatures, terrain, and 3D assets' },
    { value: 'writer', label: 'Writer', description: 'Craft narratives, rulebooks, and game copy' },
    { value: 'graphic-designer', label: 'Graphic Designer', description: 'Design layouts, icons, and marketing materials' },
    { value: 'playtester', label: 'Playtester', description: 'Test games and provide feedback' },
  ]

  const handleSubmit = (data: any) => {
    onNext(data)
  }

  return (
    <div className="onboarding-step">
      <div className="onboarding-step__header">
        <h2 className="onboarding-step__title">Welcome to Budget Zero!</h2>
        <p className="onboarding-step__description">
          Just a few quick details to get you started as a creator.
        </p>
      </div>

      <ValidatedForm
        schema={MinimalOnboardingSchema}
        onSubmit={handleSubmit}
        initialData={{ display_name: '', role: undefined, bio: '' }}
      >
        {({ values, errors, isSubmitting, setValue }) => (
          <>
            <ValidatedInput
              label="Display Name"
              name="display_name"
              value={values.display_name || ''}
              error={errors.display_name}
              onChange={(value) => setValue('display_name', value)}
              placeholder="How should others see your name?"
              required
            />

            <div className="onboarding-step__section">
              <label className="onboarding-step__label">
                What's your primary role? <span className="required">*</span>
              </label>
              <div className="onboarding-role-grid">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setValue('role', role.value)}
                    className={`onboarding-role-card ${values.role === role.value ? 'onboarding-role-card--selected' : ''}`}
                  >
                    <h4 className="onboarding-role-card__title">{role.label}</h4>
                    <p className="onboarding-role-card__description">{role.description}</p>
                  </button>
                ))}
              </div>
              {errors.role && <div className="error-text">{errors.role}</div>}
            </div>

            <ValidatedTextarea
              label="Brief Description (Optional)"
              name="bio"
              value={values.bio || ''}
              error={errors.bio}
              onChange={(value) => setValue('bio', value)}
              placeholder="Tell others briefly about your skills or interests..."
              rows={2}
              maxLength={100}
            />

            <div className="onboarding-step__actions">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Get Started
              </Button>
            </div>
          </>
        )}
      </ValidatedForm>
    </div>
  )
}


// Main Onboarding Component - Simplified Single Step
export function UserOnboarding() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const [isCompleting, setIsCompleting] = useState(false)
  const { trackOnboardingStarted, trackOnboardingCompleted, trackOnboardingAbandoned } = useOnboardingFlow()

  // Track onboarding start
  useEffect(() => {
    if (user) {
      trackOnboardingStarted(user.id)
    }
  }, [user, trackOnboardingStarted])

  const completeOnboarding = async (data: any) => {
    if (!user) return

    setIsCompleting(true)
    try {
      // Create minimal creator profile with essential data only
      const profileData: CreatorProfileInsert = {
        user_id: user.id,
        display_name: data.display_name,
        bio: data.bio || null,
        // Set user's primary role in specialties for now - this is essential for collaboration matching
        specialties: [data.role], // Store role as specialty for collaboration matching
        experience_level: 'intermediate', // Default, can be updated later
        availability_status: 'available', // Default, can be updated later
        skills: [data.role], // Use role as initial skill
      }

      const { error } = await supabase
        .from('creator_profiles')
        .insert(profileData)

      if (error) {
        throw error
      }

      // Track completion and navigate to dashboard
      trackOnboardingCompleted(user.id, data)
      navigate({ to: '/dashboard' })
    } catch (error) {
      console.error('Error completing onboarding:', error)
      trackOnboardingAbandoned(user.id, 'completion_error')
    } finally {
      setIsCompleting(false)
    }
  }

  if (isCompleting) {
    return (
      <ResponsiveContainer maxWidth="md" className="onboarding-completing">
        <Card>
          <CardBody>
            <div className="onboarding-completing__content">
              <div className="onboarding-completing__spinner"></div>
              <h2>Setting up your profile...</h2>
              <p>This will just take a moment.</p>
            </div>
          </CardBody>
        </Card>
      </ResponsiveContainer>
    )
  }

  return (
    <ErrorBoundary>
      <div className="user-onboarding">
        <ResponsiveContainer maxWidth="md">
          <Card className="onboarding-card">
            <CardBody>
              <MinimalOnboardingStep
                onNext={completeOnboarding}
                onPrevious={() => {}} // No previous step in minimal flow
                isFirstStep={true}
                isLastStep={true}
              />
            </CardBody>
          </Card>
        </ResponsiveContainer>
      </div>
    </ErrorBoundary>
  )
}