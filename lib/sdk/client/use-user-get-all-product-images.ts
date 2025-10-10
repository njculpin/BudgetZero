"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductImages() {
  const supabase = createClient();

  async function getAllProductImages(productId: string) {
    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    return { data, error };
  }

  return { getAllProductImages };
}
