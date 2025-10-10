"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAssetPricing() {
  const supabase = createClient();

  async function createAssetPricing(pricing: {
    asset_id: string;
    name: string;
    description?: string;
    price_cents: number;
    is_active?: boolean;
  }) {
    const { data, error } = await supabase
      .from("asset_pricing")
      .insert(pricing)
      .select()
      .single();

    return { data, error };
  }

  return { createAssetPricing };
}
