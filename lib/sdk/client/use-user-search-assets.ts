'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserSearchAssets() {
  const supabase = createClient()

  async function searchAssets(options: {
    query?: string
    tags?: string[]
    status?: 'draft' | 'active' | 'archived' | 'published'
    isPublic?: boolean
    isFeatured?: boolean
    seekingCollaborators?: boolean
    licenseType?: 'free' | 'attribution' | 'commercial' | 'exclusive'
    limit?: number
    offset?: number
  }) {
    let queryBuilder = supabase
      .from('assets')
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project:project_id(id, title, slug)
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

    if (options.status) {
      queryBuilder = queryBuilder.eq('status', options.status)
    }

    if (options.isPublic !== undefined) {
      queryBuilder = queryBuilder.eq('is_public', options.isPublic)
    }

    if (options.isFeatured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', options.isFeatured)
    }

    if (options.seekingCollaborators !== undefined) {
      queryBuilder = queryBuilder.eq('seeking_collaborators', options.seekingCollaborators)
    }

    if (options.licenseType) {
      queryBuilder = queryBuilder.eq('license_type', options.licenseType)
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

  return { searchAssets }
}
