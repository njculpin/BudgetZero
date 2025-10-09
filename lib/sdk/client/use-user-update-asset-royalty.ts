'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateAssetRoyalty() {
  const supabase = createClient()

  async function updateAssetRoyalty(
    id: string,
    updates: {
      percentage?: number
      is_active?: boolean
      effective_until?: string
      notes?: string
    }
  ) {
    const { data, error } = await supabase
      .from('asset_royalties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateAssetRoyalty }
}
