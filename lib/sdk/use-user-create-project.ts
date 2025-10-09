'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProject() {
  const supabase = createClient()

  async function createProject(project: {
    creator_id: string
    title: string
    description?: string
    slug: string
    status?: 'draft' | 'active' | 'archived' | 'published'
    is_public?: boolean
    cover_image_url?: string
    tags?: string[]
    license_type?: 'free' | 'attribution' | 'commercial' | 'exclusive'
    license_terms?: string
    genre?: string
    player_count_min?: number
    player_count_max?: number
    play_time_minutes?: number
    complexity_rating?: number
    seeking_collaborators?: boolean
  }) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url)
      `)
      .single()

    return { data, error }
  }

  return { createProject }
}
