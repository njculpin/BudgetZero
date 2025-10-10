"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductVariantOptions() {
  const supabase = createClient();

  async function getAllProductVariantOptions(variantId: string) {
    const { data, error } = await supabase
      .from("product_variant_options")
      .select("*")
      .eq("variant_id", variantId);

    return { data, error };
  }

  return { getAllProductVariantOptions };
}
