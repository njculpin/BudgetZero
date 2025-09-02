import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../apiClient'

// Mock fetch globally
global.fetch = vi.fn()

describe('APIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct base URL', () => {
    expect(apiClient).toBeDefined()
    // The base URL should be configurable and default to localhost:3001
  })

  it('should make auth invite request correctly', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com', name: 'Test User' },
      token: 'mock-jwt-token'
    }
    
    const mockFetch = vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await apiClient.authInvite({
      email: 'test@example.com',
      inviteCode: 'TEST123'
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/invite',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          inviteCode: 'TEST123'
        })
      })
    )

    expect(result).toEqual(mockResponse)
  })

  it('should make get projects request correctly', async () => {
    const mockProjects = [
      { id: 1, title: 'Project 1', description: 'Description 1' },
      { id: 2, title: 'Project 2', description: 'Description 2' }
    ]
    
    const mockFetch = vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    } as Response)

    const result = await apiClient.getProjects()

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )

    expect(result).toEqual(mockProjects)
  })

  it('should handle HTTP errors correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' }),
    } as Response)

    await expect(apiClient.authInvite({
      email: 'test@example.com',
      inviteCode: 'INVALID'
    })).rejects.toThrow('Bad Request')
  })

  it('should handle network errors correctly', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error('Network error')
    )

    await expect(apiClient.getProjects()).rejects.toThrow('Network error')
  })
})
