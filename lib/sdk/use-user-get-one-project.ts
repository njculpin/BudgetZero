'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetOneProject() {
  const supabase = createClient()

  async function getProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project_settings(*),
        project_licenses(*, is_active),
        project_tags(*),
        project_stats(*),
        project_collaborators(
          *,
          user:user_id(id, full_name, username, avatar_url),
          project_collaborator_permissions(*),
          project_collaborator_revenue_splits(*, is_active)
        )
      `)
      .eq('id', id)
      .single()

    return { data, error }
  }

  async function getProjectBySlug(slug: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project_settings(*),
        project_licenses(*, is_active),
        project_tags(*),
        project_stats(*),
        project_collaborators(
          *,
          user:user_id(id, full_name, username, avatar_url),
          project_collaborator_permissions(*),
          project_collaborator_revenue_splits(*, is_active)
        )
      `)
      .eq('slug', slug)
      .single()

    return { data, error }
  }

  return { getProject, getProjectBySlug }
}
