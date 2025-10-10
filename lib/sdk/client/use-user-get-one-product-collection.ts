"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneProductCollection() {
  const supabase = createClient();

  async function getProductCollection(handle: string) {
    const { data, error } = await supabase
      .from("product_collections")
      .select(`
        *,
        product_collection_items (
          product_id,
          display_order,
          products (*)
        )
      `)
      .eq("handle", handle)
      .single();

    return { data, error };
  }

  return { getProductCollection };
}
