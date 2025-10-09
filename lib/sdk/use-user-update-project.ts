'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProject() {
  const supabase = createClient()

  async function updateProject(
    id: string,
    updates: {
      title?: string
      description?: string
      slug?: string
      status?: 'draft' | 'active' | 'archived' | 'published'
      cover_image_url?: string
      published_at?: string
    }
  ) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project_settings(*),
        project_stats(*)
      `)
      .single()

    return { data, error }
  }

  return { updateProject }
}
