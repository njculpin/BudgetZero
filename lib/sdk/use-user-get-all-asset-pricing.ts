'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllAssetPricing() {
  const supabase = createClient()

  async function getAssetPricing(assetId: string, options?: {
    isActive?: boolean
  }) {
    let query = supabase
      .from('asset_pricing')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    const { data, error } = await query

    return { data, error }
  }

  return { getAssetPricing }
}
