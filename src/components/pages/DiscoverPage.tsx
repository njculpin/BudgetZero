import React, { useState } from 'react'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'
import './DiscoverPage.css'

export function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <DashboardLayout currentPage="discover">
      <div className="container discover-page">
        <div className="page-header">
          <h1 className="page-title">Discover Projects</h1>
          <p className="page-subtitle">
            Find exciting game development projects to collaborate on
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="search-filters">
          <CardBody>
            <div className="search-grid">
              <input
                type="text"
                placeholder="Search projects..."
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="board-game">Board Games</option>
                <option value="card-game">Card Games</option>
                <option value="rpg">RPG</option>
                <option value="miniature-game">Miniature Games</option>
                <option value="other">Other</option>
              </select>
              <Button variant="primary">Search</Button>
            </div>
          </CardBody>
        </Card>

        {/* Featured Projects */}
        <div className="featured-section">
          <h2 className="section-title">Featured Projects</h2>
          <div className="featured-grid">
              {/* Mock project cards */}
              {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="project-card-header">
                    <h3 className="project-card-title">Sample Project {i}</h3>
                    <span className="project-badge">
                      Board Game
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="project-description">
                    A strategic board game about building medieval cities. Looking for artists and graphic designers.
                  </p>
                  <div className="project-meta">
                    <span>🎯 2-4 players</span>
                    <span>⏱️ 60 min</span>
                    <span>👥 3 collaborators</span>
                  </div>
                  <Button variant="primary" size="small" style={{ width: '100%' }}>
                    View Project
                  </Button>
                </CardBody>
              </Card>
              ))}
            </div>
          </div>

        {/* Categories */}
        <div>
          <h2 className="section-title">Browse by Category</h2>
          <div className="categories-grid">
            {[
              { name: 'Board Games', icon: '🎲', count: 24 },
              { name: 'Card Games', icon: '🃏', count: 18 },
              { name: 'RPGs', icon: '🗡️', count: 15 },
              { name: 'Miniature Games', icon: '⚔️', count: 12 },
              { name: 'Party Games', icon: '🎉', count: 8 }
            ].map(category => (
              <Card key={category.name} className="category-card">
                <CardBody>
                  <div className="category-icon">
                    {category.icon}
                  </div>
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-count">
                    {category.count} projects
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}