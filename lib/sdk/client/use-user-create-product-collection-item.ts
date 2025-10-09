'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProductCollectionItem() {
  const supabase = createClient()

  async function createProductCollectionItem(data: {
    product_id: string
    collection_id: string
    display_order?: number
  }) {
    const { data: result, error } = await supabase
      .from('product_collection_items')
      .insert(data)
      .select()
      .single()

    return { data: result, error }
  }

  return { createProductCollectionItem }
}
