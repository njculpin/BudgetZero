'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteAssetFile() {
  const supabase = createClient()

  async function deleteAssetFile(id: string) {
    const { error } = await supabase
      .from('asset_files')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteAssetFile }
}
