'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetOneAssetStats() {
  const supabase = createClient()

  async function getAssetStats(asset_id: string) {
    const { data, error } = await supabase
      .from('asset_stats')
      .select('*')
      .eq('asset_id', asset_id)
      .single()

    return { data, error }
  }

  return { getAssetStats }
}
