"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteProductCollection() {
  const supabase = createClient();

  async function deleteProductCollection(id: string) {
    const { error } = await supabase
      .from("product_collections")
      .delete()
      .eq("id", id);

    return { error };
  }

  return { deleteProductCollection };
}
