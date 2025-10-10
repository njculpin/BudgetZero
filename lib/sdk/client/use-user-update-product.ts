"use client";

import { createClient } from "@/lib/supabase/client";
import type { UpdateProductData } from "@/lib/types/database";

export function useUserUpdateProduct() {
  const supabase = createClient();

  async function updateProduct(id: string, updates: UpdateProductData) {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateProduct };
}
