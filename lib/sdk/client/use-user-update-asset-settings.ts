'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateAssetSettings() {
  const supabase = createClient()

  async function updateAssetSettings(
    asset_id: string,
    updates: {
      is_public?: boolean
      is_featured?: boolean
      seeking_collaborators?: boolean
      allow_comments?: boolean
      allow_downloads?: boolean
    }
  ) {
    const { data, error } = await supabase
      .from('asset_settings')
      .update(updates)
      .eq('asset_id', asset_id)
      .select()
      .single()

    return { data, error }
  }

  return { updateAssetSettings }
}
