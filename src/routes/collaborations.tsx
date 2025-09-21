import { createFileRoute, redirect } from '@tanstack/react-router'
import { CollaborationsPage } from '../components/pages'
import { getCurrentUser } from '../lib/supabase'

export const Route = createFileRoute('/collaborations')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
  },
  component: CollaborationsPage
})