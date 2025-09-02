import { describe, it, expect } from 'vitest'
import type { User, Project, AuthRequest, AuthResponse } from '../api'

describe('API Types', () => {
  describe('User', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(user.id).toBe(1)
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.bio).toBe('Test bio')
      expect(user.created_at).toBe('2024-01-01T00:00:00Z')
      expect(user.updated_at).toBe('2024-01-01T00:00:00Z')
    })

    it('should allow null bio', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        bio: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(user.bio).toBeNull()
    })
  })

  describe('Project', () => {
    it('should have correct structure', () => {
      const project: Project = {
        id: 1,
        title: 'Test Project',
        description: 'Test Description',
        creator_id: 1,
        creator: {
          id: 1,
          email: 'creator@example.com',
          name: 'Creator',
          bio: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(project.id).toBe(1)
      expect(project.title).toBe('Test Project')
      expect(project.description).toBe('Test Description')
      expect(project.creator_id).toBe(1)
      expect(project.creator).toBeDefined()
      expect(project.creator.name).toBe('Creator')
    })
  })

  describe('AuthRequest', () => {
    it('should have correct structure', () => {
      const authRequest: AuthRequest = {
        email: 'test@example.com',
        inviteCode: 'TEST123'
      }

      expect(authRequest.email).toBe('test@example.com')
      expect(authRequest.inviteCode).toBe('TEST123')
    })
  })

  describe('AuthResponse', () => {
    it('should have correct structure', () => {
      const authResponse: AuthResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          bio: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        token: 'mock-jwt-token'
      }

      expect(authResponse.user).toBeDefined()
      expect(authResponse.user.id).toBe(1)
      expect(authResponse.token).toBe('mock-jwt-token')
    })
  })

  describe('Type compatibility', () => {
    it('should allow User in Project creator field', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        bio: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const project: Project = {
        id: 1,
        title: 'Test Project',
        description: 'Test Description',
        creator_id: user.id,
        creator: user,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(project.creator).toBe(user)
    })
  })
})
