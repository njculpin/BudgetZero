import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface OnboardingAnalytics {
  event_type: 'onboarding_started' | 'onboarding_completed' | 'onboarding_abandoned' | 'profile_field_completed'
  user_id?: string
  session_id?: string
  metadata?: Record<string, any>
}

// Simple analytics tracking for onboarding events
export function useOnboardingAnalytics() {
  const trackEvent = async (event: OnboardingAnalytics) => {
    try {
      // In a real implementation, you might want to:
      // 1. Send to a proper analytics service (like Mixpanel, Amplitude, etc.)
      // 2. Store in a dedicated analytics table
      // 3. Use a more sophisticated tracking system

      // For now, we'll just log to console and optionally store basic metrics
      console.log('Onboarding Analytics:', event)

      // Simple implementation: just log events for now
      // In production, you would send these to your analytics service
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  return { trackEvent }
}

// Hook to track onboarding flow progress
export function useOnboardingFlow() {
  const { trackEvent } = useOnboardingAnalytics()

  const trackOnboardingStarted = (userId?: string) => {
    trackEvent({
      event_type: 'onboarding_started',
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        flow_type: 'minimal'
      }
    })
  }

  const trackOnboardingCompleted = (userId?: string, completionData?: any) => {
    trackEvent({
      event_type: 'onboarding_completed',
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        completion_data: completionData,
        flow_type: 'minimal'
      }
    })
  }

  const trackOnboardingAbandoned = (userId?: string, step?: string) => {
    trackEvent({
      event_type: 'onboarding_abandoned',
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        abandoned_at_step: step,
        flow_type: 'minimal'
      }
    })
  }

  const trackProfileFieldCompleted = (userId?: string, field?: string, context?: string) => {
    trackEvent({
      event_type: 'profile_field_completed',
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        field_completed: field,
        completion_context: context,
        flow_type: 'progressive_disclosure'
      }
    })
  }

  // Track page abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      // In a real implementation, you might want to track abandonment
      // This is a basic example
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return {
    trackOnboardingStarted,
    trackOnboardingCompleted,
    trackOnboardingAbandoned,
    trackProfileFieldCompleted
  }
}