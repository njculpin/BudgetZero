'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetOneAssetSettings() {
  const supabase = createClient()

  async function getAssetSettings(asset_id: string) {
    const { data, error } = await supabase
      .from('asset_settings')
      .select('*')
      .eq('asset_id', asset_id)
      .single()

    return { data, error }
  }

  return { getAssetSettings }
}
