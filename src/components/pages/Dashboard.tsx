import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <DashboardLayout currentPage="dashboard">
      <main className="dashboard__main">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Dashboard</h1>
            <Button
              variant="primary"
              onClick={() => navigate({ to: '/projects' })}
            >
              View Projects
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <Card>
              <CardHeader>
                <h3>Your Projects</h3>
              </CardHeader>
              <CardBody>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  0
                </div>
                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                  No projects created yet
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3>Active Collaborations</h3>
              </CardHeader>
              <CardBody>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                  0
                </div>
                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                  No active collaborations
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3>Published Games</h3>
              </CardHeader>
              <CardBody>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                  0
                </div>
                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                  Ready to publish your first game?
                </p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3>Recent Activity</h3>
            </CardHeader>
            <CardBody>
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-gray-500)' }}>
                <p>No recent activity</p>
                <Button variant="primary" style={{ marginTop: '1rem' }} onClick={() => navigate({ to: '/projects' })}>
                  Start Your First Project
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}