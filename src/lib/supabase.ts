import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Use generated database types
export type GameProject = Database['public']['Tables']['game_projects']['Row']
export type GameProjectInsert = Database['public']['Tables']['game_projects']['Insert']
export type GameProjectUpdate = Database['public']['Tables']['game_projects']['Update']

export type Milestone = Database['public']['Tables']['milestones']['Row']
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert']
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update']

export type Contributor = Database['public']['Tables']['contributors']['Row']
export type ContributorInsert = Database['public']['Tables']['contributors']['Insert']
export type ContributorUpdate = Database['public']['Tables']['contributors']['Update']

export type GameAsset = Database['public']['Tables']['game_assets']['Row']
export type GameAssetInsert = Database['public']['Tables']['game_assets']['Insert']
export type GameAssetUpdate = Database['public']['Tables']['game_assets']['Update']

export type Rulebook = Database['public']['Tables']['rulebooks']['Row']
export type RulebookInsert = Database['public']['Tables']['rulebooks']['Insert']
export type RulebookUpdate = Database['public']['Tables']['rulebooks']['Update']

export type RulebookVersion = Database['public']['Tables']['rulebook_versions']['Row']
export type RulebookVersionInsert = Database['public']['Tables']['rulebook_versions']['Insert']
export type RulebookVersionUpdate = Database['public']['Tables']['rulebook_versions']['Update']

// Auth helper functions
export const getCurrentUser = async () => {
  // Always use real Supabase auth, even in development mode
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  // Always use real Supabase auth, even in development mode
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Database helper functions
export const getGameProjects = async (userId?: string) => {
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

export const getGameProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('game_projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

export const createGameProject = async (project: GameProjectInsert) => {
  const { data, error } = await supabase
    .from('game_projects')
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateGameProject = async (
  id: string,
  updates: GameProjectUpdate
) => {
  const { data, error } = await supabase
    .from('game_projects')
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

export const deleteGameProject = async (id: string) => {
  const { error } = await supabase
    .from('game_projects')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getMilestones = async (projectId: string) => {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const createMilestone = async (milestone: MilestoneInsert) => {
  const { data, error } = await supabase
    .from('milestones')
    .insert(milestone)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getContributors = async (projectId: string) => {
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
  const { data, error } = await supabase
    .from('rulebooks')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export const createRulebook = async (rulebook: RulebookInsert) => {
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
  updates: RulebookUpdate
) => {
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
  const { data, error } = await supabase
    .from('rulebook_versions')
    .select('*')
    .eq('rulebook_id', rulebookId)
    .order('version', { ascending: false })

  if (error) throw error
  return data
}

export const createRulebookVersion = async (version: RulebookVersionInsert) => {
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

// Role-based project queries
export const getUserProjectsWithRoles = async (userId: string) => {
  const { data, error } = await supabase
    .from('game_projects')
    .select(`
      *,
      project_roles!inner (
        role,
        permissions,
        is_active,
        joined_at
      )
    `)
    .eq('project_roles.user_id', userId)
    .eq('project_roles.is_active', true)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export const getProjectTeamSize = async (projectId: string) => {
  const { count, error } = await supabase
    .from('project_roles')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_active', true)

  if (error) throw error
  return count || 0
}

// Project merging functions
export const mergeProjectContent = async (
  targetProjectId: string,
  sourceProjectId: string,
  mergeType: 'full_merge' | 'content_merge' | 'asset_merge' = 'content_merge'
) => {
  const { data, error } = await supabase.rpc('merge_project_content', {
    target_project_id: targetProjectId,
    source_project_id: sourceProjectId,
    merge_type: mergeType
  })

  if (error) throw error
  return data
}

export const getProjectMergeHistory = async (projectId: string) => {
  const { data, error } = await supabase.rpc('get_project_merge_history', {
    project_id: projectId
  })

  if (error) throw error
  return data
}