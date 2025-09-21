import React from 'react'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'

export function CollaborationsPage() {

  return (
    <DashboardLayout currentPage="collaborations">
      <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <h1>My Collaborations</h1>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: '2rem' }}>
              Manage your contributions to other projects
            </p>
          </div>

          {/* Active Collaborations */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Active Collaborations</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {/* Mock collaboration cards */}
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Medieval Conquest</h3>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: 'var(--font-size-xs)'
                      }}>
                        Active
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-600)',
                        marginBottom: '0.5rem'
                      }}>
                        <span><strong>Role:</strong> Illustrator</span>
                        <span><strong>Milestone:</strong> Character Art</span>
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-600)',
                        marginBottom: '1rem'
                      }}>
                        <strong>Progress:</strong>
                        <div style={{
                          backgroundColor: 'var(--color-gray-200)',
                          borderRadius: 'var(--border-radius)',
                          height: '8px',
                          marginTop: '0.25rem',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            backgroundColor: 'var(--color-success)',
                            height: '100%',
                            width: '75%',
                            transition: 'width var(--transition-base)'
                          }} />
                        </div>
                        <span style={{ fontSize: 'var(--font-size-xs)' }}>75% complete</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <Button variant="primary" size="small" style={{ flex: 1 }}>
                        View Project
                      </Button>
                      <Button variant="secondary" size="small">
                        💬
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          {/* Pending Applications */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Pending Applications</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {/* Mock pending application */}
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Space Explorer RPG</h3>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--color-warning)',
                      color: 'white',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: 'var(--font-size-xs)'
                    }}>
                      Pending
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-gray-600)',
                      marginBottom: '0.5rem'
                    }}>
                      <strong>Applied for:</strong> 3D Modeler
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-gray-600)',
                      marginBottom: '1rem'
                    }}>
                      <strong>Applied:</strong> 2 days ago
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Button variant="secondary" size="small" style={{ flex: 1 }}>
                      View Application
                    </Button>
                    <Button variant="error" size="small">
                      Withdraw
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Completed Collaborations */}
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Completed Collaborations</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {/* Mock completed collaboration */}
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Dungeon Crawler</h3>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--color-gray-400)',
                      color: 'white',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: 'var(--font-size-xs)'
                    }}>
                      Completed
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-gray-600)',
                      marginBottom: '0.5rem'
                    }}>
                      <strong>Role:</strong> Graphic Designer
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-gray-600)',
                      marginBottom: '1rem'
                    }}>
                      <strong>Completed:</strong> 1 month ago
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Button variant="secondary" size="small" style={{ flex: 1 }}>
                      View Project
                    </Button>
                    <Button variant="secondary" size="small">
                      ⭐ Rate
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
      </div>
    </DashboardLayout>
  )
}