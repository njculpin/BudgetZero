"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteProductCollectionItem() {
  const supabase = createClient();

  async function deleteProductCollectionItem(id: string) {
    const { error } = await supabase
      .from("product_collection_items")
      .delete()
      .eq("id", id);

    return { error };
  }

  return { deleteProductCollectionItem };
}
