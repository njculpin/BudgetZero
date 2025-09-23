import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '../components/pages'
import { getCurrentUser } from '../lib/supabase'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Check if user is authenticated
    const user = await getCurrentUser()

    // If logged in, redirect to marketplace (the new home)
    if (user) {
      throw redirect({
        to: '/marketplace'
      })
    }
  },
  component: LandingPage
})