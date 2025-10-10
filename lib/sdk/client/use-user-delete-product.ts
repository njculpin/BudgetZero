"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteProduct() {
  const supabase = createClient();

  async function deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    return { error };
  }

  return { deleteProduct };
}
