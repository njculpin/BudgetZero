'use client'

import { createClient } from '@/lib/supabase/client'
import type { CreateProductVariantData } from '@/lib/types/database'

export function useUserCreateProductVariant() {
  const supabase = createClient()

  async function createProductVariant(data: CreateProductVariantData) {
    const { data: result, error } = await supabase
      .from('product_variants')
      .insert(data)
      .select()
      .single()

    return { data: result, error }
  }

  return { createProductVariant }
}
