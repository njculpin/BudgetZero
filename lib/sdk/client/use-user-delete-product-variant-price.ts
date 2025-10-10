"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteProductVariantPrice() {
  const supabase = createClient();

  async function deleteProductVariantPrice(id: string) {
    const { error } = await supabase
      .from("product_variant_prices")
      .delete()
      .eq("id", id);

    return { error };
  }

  return { deleteProductVariantPrice };
}
