'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteAsset() {
  const supabase = createClient()

  async function deleteAsset(id: string) {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteAsset }
}
