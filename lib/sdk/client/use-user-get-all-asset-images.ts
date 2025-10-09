'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllAssetImages() {
  const supabase = createClient()

  async function getAssetImages(assetId: string) {
    const { data, error } = await supabase
      .from('asset_images')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  return { getAssetImages }
}
