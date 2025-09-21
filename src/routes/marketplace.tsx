import { createFileRoute, redirect } from '@tanstack/react-router'
import { MarketplacePage } from '../components/pages'
import { getCurrentUser } from '../lib/supabase'

export const Route = createFileRoute('/marketplace')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
  },
  component: MarketplacePage
})