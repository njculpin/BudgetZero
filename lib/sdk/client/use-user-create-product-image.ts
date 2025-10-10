"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProductImage() {
  const supabase = createClient();

  async function createProductImage(data: {
    product_id: string;
    file_url: string;
    alt_text?: string;
    display_order?: number;
    is_primary?: boolean;
  }) {
    const { data: result, error } = await supabase
      .from("product_images")
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  return { createProductImage };
}
