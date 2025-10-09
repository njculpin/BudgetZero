'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateAssetRoyalty() {
  const supabase = createClient()

  async function createAssetRoyalty(data: {
    asset_id: string
    percentage: number
    is_active?: boolean
    effective_from?: string
    effective_until?: string
    notes?: string
  }) {
    const { data: royalty, error } = await supabase
      .from('asset_royalties')
      .insert(data)
      .select()
      .single()

    return { data: royalty, error }
  }

  return { createAssetRoyalty }
}
