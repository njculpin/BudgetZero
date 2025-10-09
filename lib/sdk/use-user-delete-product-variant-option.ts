'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProductVariantOption() {
  const supabase = createClient()

  async function deleteProductVariantOption(id: string) {
    const { error } = await supabase
      .from('product_variant_options')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProductVariantOption }
}
