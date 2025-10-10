"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProductTag() {
  const supabase = createClient();

  async function createProductTag(data: { product_id: string; tag: string }) {
    const { data: result, error } = await supabase
      .from("product_tags")
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  return { createProductTag };
}
