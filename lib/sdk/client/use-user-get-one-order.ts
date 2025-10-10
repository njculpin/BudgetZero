"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneOrder() {
  const supabase = createClient();

  async function getOrder(id: string) {
    const { data, error } = await supabase
      .from("orders")
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
      .eq("id", id)
      .single();

    return { data, error };
  }

  async function getOrderByNumber(orderNumber: string) {
    const { data, error } = await supabase
      .from("orders")
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
      .eq("order_number", orderNumber)
      .single();

    return { data, error };
  }

  return { getOrder, getOrderByNumber };
}
