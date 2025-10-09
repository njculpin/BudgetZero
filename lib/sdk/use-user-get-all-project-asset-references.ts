'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProjectAssetReferences() {
  const supabase = createClient()

  async function getProjectAssetReferences(options?: {
    projectId?: string
    assetId?: string
    requestedBy?: string
    status?: 'pending' | 'approved' | 'rejected'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('project_asset_references')
      .select(`
        *,
        project:project_id(id, title, slug),
        asset:asset_id(id, title, creator_id),
        requester:requested_by(id, full_name, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    if (options?.assetId) {
      query = query.eq('asset_id', options.assetId)
    }

    if (options?.requestedBy) {
      query = query.eq('requested_by', options.requestedBy)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    return { data, error, count }
  }

  return { getProjectAssetReferences }
}
