// Role-Based Project System Types

export type ProjectRole =
  | 'project-lead'
  | 'game-designer'
  | 'illustrator'
  | '3d-modeler'
  | 'writer'
  | 'graphic-designer'
  | 'playtester'
  | 'business-developer'
  | 'publisher'

export interface ProjectPermissions {
  can_edit_content: boolean
  can_manage_team: boolean
  can_publish: boolean
  can_merge_projects: boolean
  can_create_milestones: boolean
  can_manage_finances: boolean
}

export interface UserProjectRole {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  permissions: ProjectPermissions
  joined_at: string
  is_active: boolean
}

export interface ProjectMerge {
  id: string
  parent_project_id: string
  merged_project_id: string
  merge_type: 'full_merge' | 'asset_merge' | 'content_merge'
  merged_by: string
  merge_reason?: string
  merged_at: string
}

export interface ProjectContribution {
  id: string
  project_id: string
  contributor_id: string
  contribution_type: string
  asset_id?: string
  page_id?: string
  block_id?: string
  description?: string
  created_at: string
}

// Enhanced project interface with role-based access
export interface ProjectWithRoles {
  id: string
  name: string
  description: string
  category: string
  status: string
  creator_id: string // Project owner (maintains ownership)
  target_audience: string
  estimated_players: string
  estimated_playtime: string
  concept_art_url?: string
  created_at: string
  updated_at: string

  // Role-based additions
  user_roles: UserProjectRole[]
  my_roles: ProjectRole[] // Roles I play in this project
  my_permissions: ProjectPermissions
  is_owner: boolean // Am I the project owner?
  team_size: number
  merged_projects?: ProjectMerge[]
  recent_contributions?: ProjectContribution[]
}

// Project view types
export type ProjectViewMode = 'grid' | 'list' | 'kanban'
export type ProjectFilter = {
  roles?: ProjectRole[]
  status?: string[]
  category?: string[]
  search?: string
}

export type ProjectSort =
  | 'recent_activity'
  | 'created_date'
  | 'name'
  | 'team_size'
  | 'my_contribution'

// Team management
export interface TeamInvitation {
  id: string
  project_id: string
  invited_by: string
  invited_email: string
  proposed_role: ProjectRole
  proposed_permissions: ProjectPermissions
  message?: string
  status: 'pending' | 'accepted' | 'declined'
  expires_at: string
  created_at: string
}

export interface RoleChangeRequest {
  id: string
  project_id: string
  user_id: string
  current_role: ProjectRole
  requested_role: ProjectRole
  requested_permissions: ProjectPermissions
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
}

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermissions> = {
  'project-lead': {
    can_edit_content: true,
    can_manage_team: true,
    can_publish: true,
    can_merge_projects: true,
    can_create_milestones: true,
    can_manage_finances: true
  },
  'game-designer': {
    can_edit_content: true,
    can_manage_team: false,
    can_publish: false,
    can_merge_projects: true,
    can_create_milestones: true,
    can_manage_finances: false
  },
  'business-developer': {
    can_edit_content: false,
    can_manage_team: true,
    can_publish: true,
    can_merge_projects: true,
    can_create_milestones: true,
    can_manage_finances: true
  },
  'publisher': {
    can_edit_content: false,
    can_manage_team: true,
    can_publish: true,
    can_merge_projects: true,
    can_create_milestones: true,
    can_manage_finances: true
  },
  'illustrator': {
    can_edit_content: true,
    can_manage_team: false,
    can_publish: false,
    can_merge_projects: false,
    can_create_milestones: false,
    can_manage_finances: false
  },
  '3d-modeler': {
    can_edit_content: true,
    can_manage_team: false,
    can_publish: false,
    can_merge_projects: false,
    can_create_milestones: false,
    can_manage_finances: false
  },
  'writer': {
    can_edit_content: true,
    can_manage_team: false,
    can_publish: false,
    can_merge_projects: false,
    can_create_milestones: false,
    can_manage_finances: false
  },
  'graphic-designer': {
    can_edit_content: true,
    can_manage_team: false,
    can_publish: false,
    can_merge_projects: false,
    can_create_milestones: false,
    can_manage_finances: false
  },
  'playtester': {
    can_edit_content: false,
    can_manage_team: false,
    can_publish: false,
    can_merge_projects: false,
    can_create_milestones: false,
    can_manage_finances: false
  }
}

// Role descriptions and capabilities
export const ROLE_DESCRIPTIONS: Record<ProjectRole, {
  label: string
  description: string
  icon: string
  capabilities: string[]
}> = {
  'project-lead': {
    label: 'Project Lead',
    description: 'Overall project vision and coordination',
    icon: '👑',
    capabilities: ['Full project control', 'Team management', 'Publishing rights', 'Financial decisions']
  },
  'game-designer': {
    label: 'Game Designer',
    description: 'Core gameplay mechanics and rules',
    icon: '🎮',
    capabilities: ['Game rules', 'Mechanics design', 'Milestone creation', 'Project merging']
  },
  'illustrator': {
    label: 'Illustrator',
    description: 'Visual artwork and illustrations',
    icon: '🎨',
    capabilities: ['Artwork creation', 'Visual assets', 'Content editing']
  },
  '3d-modeler': {
    label: '3D Modeler',
    description: 'Three-dimensional assets and models',
    icon: '🧊',
    capabilities: ['3D assets', 'Model creation', 'Content editing']
  },
  'writer': {
    label: 'Writer',
    description: 'Narrative, lore, and text content',
    icon: '✍️',
    capabilities: ['Story writing', 'Rule text', 'Content editing']
  },
  'graphic-designer': {
    label: 'Graphic Designer',
    description: 'Layout, typography, and visual design',
    icon: '🎯',
    capabilities: ['Layout design', 'Typography', 'Visual identity']
  },
  'playtester': {
    label: 'Playtester',
    description: 'Game testing and feedback',
    icon: '🧪',
    capabilities: ['Game testing', 'Feedback', 'Bug reports']
  },
  'business-developer': {
    label: 'Business Developer',
    description: 'Partnerships, funding, and growth',
    icon: '💼',
    capabilities: ['Business strategy', 'Partnerships', 'Funding', 'Team growth']
  },
  'publisher': {
    label: 'Publisher',
    description: 'Publishing, marketing, and distribution',
    icon: '📚',
    capabilities: ['Publishing', 'Marketing', 'Distribution', 'Financial management']
  }
}