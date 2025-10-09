'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteAssetPricing() {
  const supabase = createClient()

  async function deleteAssetPricing(id: string) {
    const { error } = await supabase
      .from('asset_pricing')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteAssetPricing }
}
