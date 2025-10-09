'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllOrders() {
  const supabase = createClient()

  async function getOrders(options?: {
    buyerId?: string
    productId?: string
    variantId?: string
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(id, full_name, username, email),
        product:product_id(*),
        variant:variant_id(
          *,
          product_variant_prices(*)
        ),
        billing_address:billing_address_id(*),
        shipping_address:shipping_address_id(*),
        order_revenue_splits(*),
        order_metadata(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.buyerId) {
      query = query.eq('buyer_id', options.buyerId)
    }

    if (options?.productId) {
      query = query.eq('product_id', options.productId)
    }

    if (options?.variantId) {
      query = query.eq('variant_id', options.variantId)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    return { data, error, count }
  }

  return { getOrders }
}
