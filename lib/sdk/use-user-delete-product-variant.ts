'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProductVariant() {
  const supabase = createClient()

  async function deleteProductVariant(id: string) {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProductVariant }
}
