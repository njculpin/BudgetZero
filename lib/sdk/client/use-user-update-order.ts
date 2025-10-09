'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateOrder() {
  const supabase = createClient()

  async function updateOrder(
    id: string,
    updates: {
      status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
      stripe_payment_intent_id?: string
      stripe_charge_id?: string
      billing_address_id?: string
      shipping_address_id?: string
      completed_at?: string
      refunded_at?: string
    }
  ) {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
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
      `)
      .single()

    return { data, error }
  }

  return { updateOrder }
}
