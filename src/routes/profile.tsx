import { createFileRoute } from '@tanstack/react-router'
import { CreatorProfilePage } from '../components/pages'

export const Route = createFileRoute('/profile')({
  component: CreatorProfilePage,
})