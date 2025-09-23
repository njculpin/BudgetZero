import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProjectDetailPage } from '../components/pages'
import { getCurrentUser } from '../lib/supabase'

// Search params interface for tabs and other query params
interface ProjectDetailSearch {
  tab?: 'milestones' | 'rulebook'
}

export const Route = createFileRoute('/project/$projectId')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
  },
  validateSearch: (search: Record<string, unknown>): ProjectDetailSearch => {
    return {
      tab: search.tab as 'milestones' | 'rulebook' | undefined,
    }
  },
  component: ProjectDetailPage
})