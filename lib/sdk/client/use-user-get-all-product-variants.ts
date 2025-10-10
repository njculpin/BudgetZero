"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductVariants() {
  const supabase = createClient();

  async function getAllProductVariants(productId: string) {
    const { data, error } = await supabase
      .from("product_variants")
      .select(`
        *,
        product_variant_prices (*),
        product_variant_options (*),
        product_digital_files (*),
        product_print_options (*)
      `)
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    return { data, error };
  }

  return { getAllProductVariants };
}
