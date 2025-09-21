import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProjectDetailPage } from '../components/pages'
import { getCurrentUser } from '../lib/supabase'

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
  },
  component: ProjectDetailPage
})