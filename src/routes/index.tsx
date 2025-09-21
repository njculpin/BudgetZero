import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../components/pages'

export const Route = createFileRoute('/')({
  component: LandingPage
})