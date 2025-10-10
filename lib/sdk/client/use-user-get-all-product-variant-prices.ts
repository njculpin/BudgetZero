"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductVariantPrices() {
  const supabase = createClient();

  async function getAllProductVariantPrices(
    variantId: string,
    filters?: {
      currency_code?: string;
      is_active?: boolean;
    },
  ) {
    let query = supabase
      .from("product_variant_prices")
      .select("*")
      .eq("variant_id", variantId);

    if (filters?.currency_code) {
      query = query.eq("currency_code", filters.currency_code);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    const { data, error } = await query;

    return { data, error };
  }

  return { getAllProductVariantPrices };
}
