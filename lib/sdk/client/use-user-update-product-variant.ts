"use client";

import { createClient } from "@/lib/supabase/client";
import type { UpdateProductVariantData } from "@/lib/types/database";

export function useUserUpdateProductVariant() {
  const supabase = createClient();

  async function updateProductVariant(
    id: string,
    updates: UpdateProductVariantData,
  ) {
    const { data, error } = await supabase
      .from("product_variants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateProductVariant };
}
