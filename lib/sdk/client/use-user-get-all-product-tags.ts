'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProductTags() {
  const supabase = createClient()

  async function getAllProductTags(productId: string) {
    const { data, error } = await supabase
      .from('product_tags')
      .select('*')
      .eq('product_id', productId)

    return { data, error }
  }

  return { getAllProductTags }
}
