'use client'

import { createClient } from '@/lib/supabase/client'
import type { CreateProductData } from '@/lib/types/database'

export function useUserCreateProduct() {
  const supabase = createClient()

  async function createProduct(productData: CreateProductData) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    return { data, error }
  }

  return { createProduct }
}
