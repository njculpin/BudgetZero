"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneProductSeo() {
  const supabase = createClient();

  async function getProductSeo(productId: string) {
    const { data, error } = await supabase
      .from("product_seo")
      .select("*")
      .eq("product_id", productId)
      .single();

    return { data, error };
  }

  return { getProductSeo };
}
