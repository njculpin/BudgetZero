import { createClient } from '@supabase/supabase-js'
import { isDevelopmentMode, mockApi } from './mockData'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface GameProject {
  id: string
  name: string
  description: string
  category: 'board-game' | 'card-game' | 'rpg' | 'miniature-game' | 'other'
  status: 'idea' | 'in-development' | 'completed' | 'published'
  creator_id: string
  target_audience: string
  estimated_players: string
  estimated_playtime: string
  concept_art_url?: string
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string
  funding_goal: number
  current_funding: number
  deliverables: string[]
  timeline_weeks: number
  required_skills: string[]
  status: 'planning' | 'funding' | 'in-progress' | 'completed'
  created_at: string
  deadline?: string
}

export interface Contributor {
  id: string
  user_id: string
  project_id: string
  milestone_id?: string
  role: 'illustrator' | '3d-modeler' | 'writer' | 'graphic-designer' | 'game-designer' | 'playtester'
  compensation_type: 'equity' | 'fixed' | 'royalty' | 'credit' | 'hybrid'
  compensation_details: string
  status: 'applied' | 'accepted' | 'active' | 'completed'
  application_message?: string
  portfolio_links: string[]
  created_at: string
}

export interface GameAsset {
  id: string
  project_id: string
  contributor_id: string
  name: string
  type: 'image' | '3d-model' | 'document' | 'audio' | 'video' | 'other'
  file_url: string
  file_size: number
  version: number
  status: 'draft' | 'review' | 'approved' | 'rejected'
  created_at: string
}

export interface Rulebook {
  id: string
  project_id: string
  title: string
  content: string
  version: number
  template_id?: string
  last_edited_by: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface RulebookVersion {
  id: string
  rulebook_id: string
  content: string
  version: number
  edited_by: string
  change_summary?: string
  created_at: string
}

// Auth helper functions
export const getCurrentUser = async () => {
  if (isDevelopmentMode) {
    return mockApi.getCurrentUser()
  }
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  if (isDevelopmentMode) {
    return mockApi.signOut()
  }
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Database helper functions
export const getGameProjects = async (userId?: string) => {
  if (isDevelopmentMode) {
    return mockApi.getGameProjects(userId)
  }

  let query = supabase
    .from('game_projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('creator_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const createGameProject = async (project: Omit<GameProject, 'id' | 'created_at' | 'updated_at'>) => {
  if (isDevelopmentMode) {
    return mockApi.createGameProject(project)
  }

  const { data, error } = await supabase
    .from('game_projects')
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getMilestones = async (projectId: string) => {
  if (isDevelopmentMode) {
    return mockApi.getMilestones(projectId)
  }

  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const createMilestone = async (milestone: Omit<Milestone, 'id' | 'created_at'>) => {
  if (isDevelopmentMode) {
    return mockApi.createMilestone(milestone)
  }

  const { data, error } = await supabase
    .from('milestones')
    .insert(milestone)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getContributors = async (projectId: string) => {
  if (isDevelopmentMode) {
    return mockApi.getContributors(projectId)
  }

  const { data, error } = await supabase
    .from('contributors')
    .select(`
      *,
      profiles:user_id (
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Rulebook helper functions
export const getRulebook = async (projectId: string) => {
  if (isDevelopmentMode) {
    return mockApi.getRulebook(projectId)
  }

  const { data, error } = await supabase
    .from('rulebooks')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export const createRulebook = async (rulebook: Omit<Rulebook, 'id' | 'created_at' | 'updated_at'>) => {
  if (isDevelopmentMode) {
    return mockApi.createRulebook(rulebook)
  }

  const { data, error } = await supabase
    .from('rulebooks')
    .insert({
      ...rulebook,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateRulebook = async (
  id: string,
  updates: Partial<Pick<Rulebook, 'title' | 'content' | 'template_id' | 'last_edited_by' | 'is_published'>>
) => {
  if (isDevelopmentMode) {
    return mockApi.updateRulebook(id, updates)
  }

  const { data, error } = await supabase
    .from('rulebooks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getRulebookVersions = async (rulebookId: string) => {
  if (isDevelopmentMode) {
    return mockApi.getRulebookVersions(rulebookId)
  }

  const { data, error } = await supabase
    .from('rulebook_versions')
    .select('*')
    .eq('rulebook_id', rulebookId)
    .order('version', { ascending: false })

  if (error) throw error
  return data
}

export const createRulebookVersion = async (version: Omit<RulebookVersion, 'id' | 'created_at'>) => {
  if (isDevelopmentMode) {
    return mockApi.createRulebookVersion(version)
  }

  const { data, error } = await supabase
    .from('rulebook_versions')
    .insert({
      ...version,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}