'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserSearchProjects() {
  const supabase = createClient()

  async function searchProjects(options: {
    query?: string
    tags?: string[]
    genre?: string
    status?: 'draft' | 'active' | 'archived' | 'published'
    isPublic?: boolean
    seekingCollaborators?: boolean
    playerCountMin?: number
    playerCountMax?: number
    complexityRating?: number
    limit?: number
    offset?: number
  }) {
    let queryBuilder = supabase
      .from('projects')
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options.query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${options.query}%,description.ilike.%${options.query}%`
      )
    }

    if (options.tags && options.tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', options.tags)
    }

    if (options.genre) {
      queryBuilder = queryBuilder.eq('genre', options.genre)
    }

    if (options.status) {
      queryBuilder = queryBuilder.eq('status', options.status)
    }

    if (options.isPublic !== undefined) {
      queryBuilder = queryBuilder.eq('is_public', options.isPublic)
    }

    if (options.seekingCollaborators !== undefined) {
      queryBuilder = queryBuilder.eq('seeking_collaborators', options.seekingCollaborators)
    }

    if (options.playerCountMin !== undefined) {
      queryBuilder = queryBuilder.gte('player_count_min', options.playerCountMin)
    }

    if (options.playerCountMax !== undefined) {
      queryBuilder = queryBuilder.lte('player_count_max', options.playerCountMax)
    }

    if (options.complexityRating !== undefined) {
      queryBuilder = queryBuilder.eq('complexity_rating', options.complexityRating)
    }

    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit)
    }

    if (options.offset) {
      queryBuilder = queryBuilder.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await queryBuilder

    return { data, error, count }
  }

  return { searchProjects }
}
