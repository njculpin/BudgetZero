import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorBoundary } from '../components/ui'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="app">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <TanStackRouterDevtools />
    </>
  )
})