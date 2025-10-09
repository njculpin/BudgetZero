'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProductImage() {
  const supabase = createClient()

  async function deleteProductImage(id: string) {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProductImage }
}
