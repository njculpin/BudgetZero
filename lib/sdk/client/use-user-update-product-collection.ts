"use client";

import { createClient } from "@/lib/supabase/client";
import type { UpdateProductCollectionData } from "@/lib/types/database";

export function useUserUpdateProductCollection() {
  const supabase = createClient();

  async function updateProductCollection(
    id: string,
    updates: UpdateProductCollectionData,
  ) {
    const { data, error } = await supabase
      .from("product_collections")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateProductCollection };
}
