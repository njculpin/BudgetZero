"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProductVariantOption() {
  const supabase = createClient();

  async function createProductVariantOption(data: {
    variant_id: string;
    option_name: string;
    option_value: string;
  }) {
    const { data: result, error } = await supabase
      .from("product_variant_options")
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  return { createProductVariantOption };
}
