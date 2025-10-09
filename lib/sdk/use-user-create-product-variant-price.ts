'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProductVariantPrice() {
  const supabase = createClient()

  async function createProductVariantPrice(data: {
    variant_id: string
    currency_code: string
    amount_cents: number
    compare_at_amount_cents?: number
    is_active?: boolean
  }) {
    const { data: result, error } = await supabase
      .from('product_variant_prices')
      .insert(data)
      .select()
      .single()

    return { data: result, error }
  }

  return { createProductVariantPrice }
}
