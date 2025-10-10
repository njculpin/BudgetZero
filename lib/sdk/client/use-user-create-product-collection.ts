"use client";

import { createClient } from "@/lib/supabase/client";
import type { CreateProductCollectionData } from "@/lib/types/database";

export function useUserCreateProductCollection() {
  const supabase = createClient();

  async function createProductCollection(data: CreateProductCollectionData) {
    const { data: result, error } = await supabase
      .from("product_collections")
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  return { createProductCollection };
}
