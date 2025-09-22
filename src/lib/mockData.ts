import { GameProject, Milestone, Contributor, Rulebook, RulebookVersion } from './supabase'

// Mock user data
export const mockUser = {
  id: 'mock-user-1',
  email: 'demo@budgetzero.com',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: null
  }
}

// Mock game projects
export const mockGameProjects: GameProject[] = [
  {
    id: 'project-1',
    name: 'Medieval Conquest',
    description: 'A strategic board game about building medieval kingdoms and conquering territories.',
    category: 'board-game',
    status: 'in-development',
    creator_id: 'mock-user-1',
    target_audience: 'Adults',
    estimated_players: '2-4 players',
    estimated_playtime: '60-90 minutes',
    concept_art_url: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'project-2',
    name: 'Space Explorer RPG',
    description: 'A collaborative role-playing game set in the far reaches of space.',
    category: 'rpg',
    status: 'idea',
    creator_id: 'mock-user-1',
    target_audience: 'Teens & Adults',
    estimated_players: '3-6 players',
    estimated_playtime: '3-4 hours',
    concept_art_url: null,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T16:45:00Z'
  },
  {
    id: 'project-3',
    name: 'Dungeon Cards',
    description: 'A fast-paced card game with dungeon crawling mechanics.',
    category: 'card-game',
    status: 'completed',
    creator_id: 'other-user-1',
    target_audience: 'All Ages',
    estimated_players: '2-6 players',
    estimated_playtime: '30-45 minutes',
    concept_art_url: null,
    created_at: '2023-12-01T12:00:00Z',
    updated_at: '2024-01-05T10:00:00Z'
  },
  {
    id: 'project-4',
    name: 'Galactic Empire',
    description: 'An epic strategy game of space conquest and diplomacy.',
    category: 'board-game',
    status: 'published',
    creator_id: 'other-user-2',
    target_audience: 'Adults',
    estimated_players: '3-5 players',
    estimated_playtime: '120-180 minutes',
    concept_art_url: null,
    created_at: '2023-11-15T08:00:00Z',
    updated_at: '2024-01-12T11:20:00Z'
  }
]

// Mock milestones
export const mockMilestones: Milestone[] = [
  {
    id: 'milestone-1',
    project_id: 'project-1',
    name: 'Core Game Mechanics',
    description: 'Design and test the basic gameplay mechanics',
    funding_goal: 2500,
    current_funding: 1800,
    deliverables: ['Game rules document', 'Prototype components', 'Playtesting results'],
    timeline_weeks: 4,
    required_skills: ['Game Design', 'Playtesting'],
    status: 'in-progress',
    created_at: '2024-01-15T10:00:00Z',
    deadline: '2024-02-15T23:59:59Z'
  },
  {
    id: 'milestone-2',
    project_id: 'project-1',
    name: 'Artwork & Graphics',
    description: 'Create all visual assets for the game',
    funding_goal: 5000,
    current_funding: 500,
    deliverables: ['Card artwork', 'Board design', 'Component illustrations'],
    timeline_weeks: 8,
    required_skills: ['Illustration', 'Graphic Design'],
    status: 'funding',
    created_at: '2024-01-16T12:00:00Z',
    deadline: '2024-03-15T23:59:59Z'
  }
]

// Mock contributors
export const mockContributors: Contributor[] = [
  {
    id: 'contributor-1',
    user_id: 'artist-user-1',
    project_id: 'project-1',
    milestone_id: 'milestone-2',
    role: 'illustrator',
    compensation_type: 'equity',
    compensation_details: '5% revenue share',
    status: 'accepted',
    application_message: 'I have 5 years of experience in board game illustration...',
    portfolio_links: ['https://portfolio.example.com'],
    created_at: '2024-01-17T14:30:00Z'
  }
]

// Mock rulebooks
export const mockRulebooks: Rulebook[] = [
  {
    id: 'rulebook-1',
    project_id: 'project-1',
    title: 'Medieval Conquest Rules',
    content: '<h1>Medieval Conquest</h1><p>Welcome to Medieval Conquest, a strategic board game...</p>',
    version: 1,
    last_edited_by: 'mock-user-1',
    is_published: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  }
]

// Development mode flag
export const isDevelopmentMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

// Mock API functions
export const mockApi = {
  // Auth functions
  getCurrentUser: async () => mockUser,
  signOut: async () => {},

  // Game Projects
  getGameProjects: async (userId?: string): Promise<GameProject[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
    if (userId) {
      return mockGameProjects.filter(p => p.creator_id === userId)
    }
    return mockGameProjects
  },

  createGameProject: async (project: Omit<GameProject, 'id' | 'created_at' | 'updated_at'>): Promise<GameProject> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newProject: GameProject = {
      ...project,
      id: `project-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockGameProjects.unshift(newProject)
    return newProject
  },
  updateGameProject: async (id: string, updates: Partial<Omit<GameProject, 'id' | 'created_at' | 'updated_at' | 'creator_id'>>): Promise<GameProject> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const projectIndex = mockGameProjects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      throw new Error('Project not found')
    }
    const updatedProject: GameProject = {
      ...mockGameProjects[projectIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }
    mockGameProjects[projectIndex] = updatedProject
    return updatedProject
  },
  deleteGameProject: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const projectIndex = mockGameProjects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      throw new Error('Project not found')
    }
    mockGameProjects.splice(projectIndex, 1)
  },

  // Milestones
  getMilestones: async (projectId: string): Promise<Milestone[]> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockMilestones.filter(m => m.project_id === projectId)
  },

  createMilestone: async (milestone: Omit<Milestone, 'id' | 'created_at'>): Promise<Milestone> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    mockMilestones.push(newMilestone)
    return newMilestone
  },

  // Contributors
  getContributors: async (projectId: string): Promise<Contributor[]> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockContributors.filter(c => c.project_id === projectId)
  },

  // Rulebooks
  getRulebook: async (projectId: string): Promise<Rulebook | null> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockRulebooks.find(r => r.project_id === projectId) || null
  },

  createRulebook: async (rulebook: Omit<Rulebook, 'id' | 'created_at' | 'updated_at'>): Promise<Rulebook> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newRulebook: Rulebook = {
      ...rulebook,
      id: `rulebook-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockRulebooks.push(newRulebook)
    return newRulebook
  },

  updateRulebook: async (id: string, updates: Partial<Rulebook>): Promise<Rulebook> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const rulebookIndex = mockRulebooks.findIndex(r => r.id === id)
    if (rulebookIndex === -1) throw new Error('Rulebook not found')

    mockRulebooks[rulebookIndex] = {
      ...mockRulebooks[rulebookIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }
    return mockRulebooks[rulebookIndex]
  },

  getRulebookVersions: async (_rulebookId: string): Promise<RulebookVersion[]> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [] // Empty for now
  },

  createRulebookVersion: async (version: Omit<RulebookVersion, 'id' | 'created_at'>): Promise<RulebookVersion> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      ...version,
      id: `version-${Date.now()}`,
      created_at: new Date().toISOString()
    }
  }
}