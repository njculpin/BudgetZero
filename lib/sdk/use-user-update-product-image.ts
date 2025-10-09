'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProductImage() {
  const supabase = createClient()

  async function updateProductImage(id: string, updates: {
    file_url?: string
    alt_text?: string
    display_order?: number
    is_primary?: boolean
  }) {
    const { data, error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateProductImage }
}
