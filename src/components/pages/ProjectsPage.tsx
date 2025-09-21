import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { GameProjectCard } from '../features'
import { GameProjectForm } from '../forms'
import { DashboardLayout } from '../layouts'
import { useAuth } from '../../hooks/useAuth'
import { useUserGameProjects } from '../../hooks/useGameProjects'
import { GameProject } from '../../lib/supabase'
import './ProjectsPage.css'

export function ProjectsPage() {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: projects, isLoading, refetch } = useUserGameProjects(user?.id)

  const handleViewProject = (project: GameProject) => {
    navigate({ to: `/projects/${project.id}` })
  }

  const handleEditProject = (project: GameProject) => {
    // TODO: Implement edit functionality
    console.log('Edit project:', project)
  }

  const handleDeleteProject = (project: GameProject) => {
    // TODO: Implement delete functionality
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      console.log('Delete project:', project)
    }
  }

  return (
    <DashboardLayout currentPage="projects">
      <div className="container">
        <div className="projects-header">
          <h1>My Projects</h1>
          <Button
            variant="primary"
            onClick={() => setShowProjectForm(true)}
          >
            Create Project
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardBody>
              <div className="loading-state">
                Loading projects...
              </div>
            </CardBody>
          </Card>
        ) : projects && projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <GameProjectCard
                key={project.id}
                project={project}
                onView={handleViewProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                showOwnerActions={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <h3>No Projects Yet</h3>
            </CardHeader>
            <CardBody>
              <div className="empty-state">
                <p className="empty-state__description">
                  You haven't created any game projects yet. Start by creating your first project and begin your collaborative game development journey.
                </p>
                <p className="empty-state__subtitle">
                  Ideas for your first project:
                </p>
                <ul className="empty-state__list">
                  <li>A strategic board game about building civilizations</li>
                  <li>A quick card game for families and friends</li>
                  <li>A cooperative RPG adventure system</li>
                  <li>A tactical miniature skirmish game</li>
                </ul>
                <Button
                  variant="primary"
                  onClick={() => setShowProjectForm(true)}
                >
                  Create Your First Project
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {showProjectForm && (
        <GameProjectForm
          onClose={() => setShowProjectForm(false)}
          onSuccess={(project) => {
            refetch()
            navigate({ to: `/projects/${project.id}` })
          }}
        />
      )}
    </DashboardLayout>
  )
}