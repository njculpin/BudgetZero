// Budget Zero Database Utility
// Mock data for client-side development
// TODO: Replace with server-side API calls

export interface User {
  id: string
  email: string
  name: string
  bio?: string
  avatarUrl?: string
  invitedByUserId?: string
  invitedByCode?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  creatorId: string
  status: string
  category: string
  targetAudience?: string
  playerCount?: string
  playTime?: string
  complexity: string
  featuredImage?: string
  createdAt: Date
  updatedAt: Date
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  fundingGoal: number
  currentFunding: number
  status: string
  orderIndex: number
  deadline?: Date
  deliverables: string[]
  createdAt: Date
  completedAt?: Date
}

export interface Invite {
  id: string
  code: string
  inviterId: string
  inviteType: string
  maxUses: number
  currentUses: number
  expiresAt?: Date
  status: string
  createdAt: Date
  lastUsedAt?: Date
}

export class DatabaseConnection {
  private mockData: {
    users: User[]
    invites: Invite[]
    projects: Project[]
    milestones: Milestone[]
  }

  constructor() {
    // Initialize mock data
    this.mockData = {
      users: [
        {
          id: 'admin-001',
          email: 'admin@budgetzero.dev',
          name: 'Admin User',
          bio: 'Platform administrator and demo user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'creator-001',
          email: 'creator@budgetzero.dev',
          name: 'Demo Creator',
          bio: 'Game designer and project creator',
          invitedByCode: 'CREATOR2024',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'artist-001',
          email: 'artist@budgetzero.dev',
          name: 'Demo Artist',
          bio: 'Illustrator and visual designer',
          invitedByCode: 'CONTRIB2024',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'writer-001',
          email: 'writer@budgetzero.dev',
          name: 'Demo Writer',
          bio: 'Rules writer and narrative designer',
          invitedByCode: 'CONTRIB2024',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      invites: [
        {
          id: 'invite-001',
          code: 'CREATOR2024',
          inviterId: 'admin-001',
          inviteType: 'creator',
          maxUses: 10,
          currentUses: 1,
          status: 'active',
          createdAt: new Date()
        },
        {
          id: 'invite-002',
          code: 'CONTRIB2024',
          inviterId: 'admin-001',
          inviteType: 'contributor',
          maxUses: 20,
          currentUses: 2,
          status: 'active',
          createdAt: new Date()
        },
        {
          id: 'invite-003',
          code: 'VIP2024',
          inviterId: 'admin-001',
          inviteType: 'vip',
          maxUses: 5,
          currentUses: 1,
          status: 'active',
          createdAt: new Date()
        },
        {
          id: 'invite-004',
          code: 'GENERAL2024',
          inviterId: 'admin-001',
          inviteType: 'general',
          maxUses: 50,
          currentUses: 0,
          status: 'active',
          createdAt: new Date()
        }
      ],
      projects: [
        {
          id: 'project-001',
          name: 'Cosmic Explorers',
          description: 'A space exploration board game where players discover new worlds and build colonies',
          creatorId: 'creator-001',
          status: 'In Development',
          category: 'Board Game',
          targetAudience: 'Ages 12+',
          playerCount: '2-4 players',
          playTime: '60-90 minutes',
          complexity: 'Medium',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'project-002',
          name: 'Dragon Keepers',
          description: 'A cooperative card game where players work together to protect a magical dragon egg',
          creatorId: 'creator-001',
          status: 'Idea',
          category: 'Card Game',
          targetAudience: 'Ages 8+',
          playerCount: '1-4 players',
          playTime: '30-45 minutes',
          complexity: 'Light',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'project-003',
          name: 'Steampunk Adventures',
          description: 'An RPG set in a Victorian-era world with steam-powered technology and magic',
          creatorId: 'creator-001',
          status: 'Planning',
          category: 'RPG',
          targetAudience: 'Ages 14+',
          playerCount: '3-6 players',
          playTime: '120-180 minutes',
          complexity: 'Heavy',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      milestones: [
        {
          id: 'milestone-001',
          projectId: 'project-001',
          title: 'Core Mechanics Design',
          description: 'Design and test the basic game mechanics including movement, combat, and resource management',
          fundingGoal: 500,
          currentFunding: 0,
          status: 'Planning',
          orderIndex: 1,
          deliverables: [],
          createdAt: new Date()
        },
        {
          id: 'milestone-002',
          projectId: 'project-001',
          title: 'Artwork and Visual Design',
          description: 'Create concept art, character designs, and visual assets for the game',
          fundingGoal: 800,
          currentFunding: 0,
          status: 'Planning',
          orderIndex: 2,
          deliverables: [],
          createdAt: new Date()
        },
        {
          id: 'milestone-003',
          projectId: 'project-001',
          title: 'Rulebook and Testing',
          description: 'Write comprehensive rulebook and conduct playtesting sessions',
          fundingGoal: 400,
          currentFunding: 0,
          status: 'Planning',
          orderIndex: 3,
          deliverables: [],
          createdAt: new Date()
        },
        {
          id: 'milestone-004',
          projectId: 'project-001',
          title: 'Production Ready',
          description: 'Finalize all assets and prepare for manufacturing',
          fundingGoal: 1200,
          currentFunding: 0,
          status: 'Planning',
          orderIndex: 4,
          deliverables: [],
          createdAt: new Date()
        }
      ]
    }
  }

  async connect(): Promise<void> {
    console.log('Connected to mock database')
  }

  async disconnect(): Promise<void> {
    console.log('Disconnected from mock database')
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    return this.mockData.users.find(user => user.email === email) || null
  }

  async createUser(data: {
    email: string
    name: string
    invitedByCode?: string
  }): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      invitedByCode: data.invitedByCode,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.mockData.users.push(newUser)
    return newUser
  }

  // Invite operations
  async findInviteByCode(code: string): Promise<Invite | null> {
    return this.mockData.invites.find(invite => invite.code === code) || null
  }

  async validateInviteCode(code: string): Promise<Invite | null> {
    const invite = this.mockData.invites.find(invite => 
      invite.code === code && 
      invite.status === 'active' && 
      invite.currentUses < invite.maxUses
    )
    
    return invite || null
  }

  async useInviteCode(inviteId: string, _inviteeId: string, _inviteeEmail: string): Promise<void> {
    const invite = this.mockData.invites.find(i => i.id === inviteId)
    if (invite) {
      invite.currentUses += 1
      invite.lastUsedAt = new Date()
    }
  }

  // Project operations
  async findProjectsByCreator(creatorId: string): Promise<Project[]> {
    return this.mockData.projects.filter(project => project.creatorId === creatorId)
  }

  async findProjectById(id: string): Promise<Project | null> {
    return this.mockData.projects.find(project => project.id === id) || null
  }

  // Milestone operations
  async findMilestonesByProject(projectId: string): Promise<Milestone[]> {
    return this.mockData.milestones.filter(milestone => milestone.projectId === projectId)
  }

  // Generic query method for backward compatibility
  async query<T = any>(_table: string, _options: {
    select?: string
    filter?: Record<string, any>
    order?: string
    limit?: number
  } = {}): Promise<T[]> {
    console.log('Generic query method called for table:', _table)
    return []
  }

  async queryOne<T = any>(_table: string, _options: {
    select?: string
    filter?: Record<string, any>
  } = {}): Promise<T | null> {
    return null
  }
}

// Singleton database instance
let databaseInstance: DatabaseConnection | null = null

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!databaseInstance) {
    databaseInstance = new DatabaseConnection()
    await databaseInstance.connect()
  }
  return databaseInstance
}

export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    await databaseInstance.disconnect()
    databaseInstance = null
  }
}
