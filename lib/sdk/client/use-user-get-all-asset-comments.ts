'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllAssetComments() {
  const supabase = createClient()

  async function getAssetComments(assetId: string, options?: {
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('asset_comments')
      .select(`
        *,
        author:author_id(id, full_name, username, avatar_url)
      `, { count: 'exact' })
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    return { data, error, count }
  }

  return { getAssetComments }
}
