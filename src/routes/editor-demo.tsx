import { createFileRoute, redirect } from '@tanstack/react-router'
import { EditorDemo } from '../components/pages/EditorDemo'
import { getCurrentUser } from '../lib/supabase'

export const Route = createFileRoute('/editor-demo')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
  },
  component: EditorDemo
})