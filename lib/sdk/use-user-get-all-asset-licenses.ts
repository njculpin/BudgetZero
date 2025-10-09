'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllAssetLicenses() {
  const supabase = createClient()

  async function getAssetLicenses(options?: {
    licensorId?: string
    licenseeId?: string
    assetId?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('asset_licenses')
      .select(`
        *,
        licensor:licensor_id(id, full_name, username),
        licensee:licensee_id(id, full_name, username),
        asset:asset_id(id, title),
        license:license_id(id, title)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.licensorId) {
      query = query.eq('licensor_id', options.licensorId)
    }

    if (options?.licenseeId) {
      query = query.eq('licensee_id', options.licenseeId)
    }

    if (options?.assetId) {
      query = query.eq('asset_id', options.assetId)
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

  return { getAssetLicenses }
}
