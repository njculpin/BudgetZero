import { createFileRoute, redirect } from '@tanstack/react-router'
import { Dashboard } from '../components/pages'
import { getCurrentUser } from '../lib/supabase'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
  },
  component: Dashboard
})