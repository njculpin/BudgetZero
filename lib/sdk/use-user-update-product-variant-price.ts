'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProductVariantPrice() {
  const supabase = createClient()

  async function updateProductVariantPrice(id: string, updates: {
    amount_cents?: number
    compare_at_amount_cents?: number
    is_active?: boolean
  }) {
    const { data, error } = await supabase
      .from('product_variant_prices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateProductVariantPrice }
}
