'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateAssetImage() {
  const supabase = createClient()

  async function createAssetImage(image: {
    asset_id: string
    file_url: string
    file_size_bytes?: number
    file_format?: string
  }) {
    const { data, error } = await supabase
      .from('asset_images')
      .insert(image)
      .select()
      .single()

    return { data, error }
  }

  return { createAssetImage }
}
