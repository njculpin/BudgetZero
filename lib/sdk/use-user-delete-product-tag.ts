'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProductTag() {
  const supabase = createClient()

  async function deleteProductTag(id: string) {
    const { error } = await supabase
      .from('product_tags')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProductTag }
}
