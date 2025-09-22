import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'
import { useGameProjects } from '../../hooks/useGameProjects'
import { GameProjectCard } from '../features'

export function MarketplacePage() {
  const navigate = useNavigate()
  const { data: publishedProjects, isLoading } = useGameProjects()

  // Filter only published/completed projects for the marketplace
  const marketplaceProjects = publishedProjects?.filter(
    project => project.status === 'published' || project.status === 'completed'
  ) || []

  return (
    <DashboardLayout currentPage="marketplace">
      <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1>Digital Marketplace</h1>
              <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
                Discover and purchase completed tabletop games from our creative community
              </p>
            </div>
          </div>

          {/* Marketplace Categories */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <Button variant="primary" size="small">All Games</Button>
            <Button variant="secondary" size="small">Board Games</Button>
            <Button variant="secondary" size="small">Card Games</Button>
            <Button variant="secondary" size="small">RPGs</Button>
            <Button variant="secondary" size="small">Miniature Games</Button>
            <Button variant="secondary" size="small">Print & Play</Button>
            <Button variant="secondary" size="small">3D Models</Button>
          </div>

          {isLoading ? (
            <Card>
              <CardBody>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  Loading marketplace...
                </div>
              </CardBody>
            </Card>
          ) : marketplaceProjects.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {marketplaceProjects.map((project) => (
                <GameProjectCard
                  key={project.id}
                  project={project}
                  onView={(project) => navigate({ to: `/marketplace/${project.id}` })}
                  showOwnerActions={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <h3>No Published Games Yet</h3>
              </CardHeader>
              <CardBody>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
                    The marketplace is just getting started! Be among the first creators to publish your completed games and start selling to our community.
                  </p>
                  <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem', fontSize: 'var(--font-size-sm)' }}>
                    Coming soon to the marketplace:
                  </p>
                  <ul style={{
                    textAlign: 'left',
                    display: 'inline-block',
                    color: 'var(--color-gray-600)',
                    fontSize: 'var(--font-size-sm)',
                    marginBottom: '2rem'
                  }}>
                    <li>Complete rulebook PDFs ready for printing</li>
                    <li>Print-and-play game files in multiple formats</li>
                    <li>3D printable miniatures and game components</li>
                    <li>Card deck PDFs optimized for professional printing</li>
                    <li>Digital companion apps and tools</li>
                  </ul>
                  <Button
                    variant="primary"
                    onClick={() => navigate({ to: '/projects' })}
                  >
                    Create Your First Game
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
      </div>
    </DashboardLayout>
  )
}