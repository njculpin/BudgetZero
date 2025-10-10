"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateOrder() {
  const supabase = createClient();

  async function createOrder(order: {
    order_number: string;
    buyer_id: string;
    product_id: string;
    variant_id: string;
    currency_code: string;
    subtotal_cents: number;
    platform_fee_cents: number;
    total_cents: number;
    status?:
      | "pending"
      | "processing"
      | "completed"
      | "failed"
      | "refunded"
      | "cancelled";
    stripe_payment_intent_id?: string;
    stripe_charge_id?: string;
    billing_address_id?: string;
    shipping_address_id?: string;
  }) {
    const { data, error } = await supabase
      .from("orders")
      .insert(order)
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
      .single();

    return { data, error };
  }

  return { createOrder };
}
