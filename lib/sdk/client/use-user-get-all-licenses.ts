'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllLicenses() {
  const supabase = createClient()

  async function getLicenses(options?: {
    creatorId?: string
    isPlatformDefault?: boolean
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('licenses')
      .select(`
        *,
        creator:creator_id(id, full_name, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.creatorId) {
      query = query.eq('creator_id', options.creatorId)
    }

    if (options?.isPlatformDefault !== undefined) {
      query = query.eq('is_platform_default', options.isPlatformDefault)
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

  return { getLicenses }
}
