import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui'

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__header">
        <h1 className="landing__title">Budget Zero</h1>
        <p className="landing__subtitle">
          Transform your game ideas into published products with zero upfront investment.
          Collaborate with illustrators, 3D modelers, writers, and designers to bring tabletop games to life.
        </p>
        <div className="landing__actions">
          <Link to="/auth">
            <Button variant="secondary" size="large">
              Start Creating
            </Button>
          </Link>
          <Button variant="primary" size="large">
            Browse Games
          </Button>
        </div>
      </header>
      <footer className="landing__footer">
        <p>&copy; 2024 Budget Zero. Collaborative game design platform.</p>
      </footer>
    </div>
  )
}