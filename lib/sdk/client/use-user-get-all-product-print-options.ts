"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductPrintOptions() {
  const supabase = createClient();

  async function getAllProductPrintOptions(variantId: string) {
    const { data, error } = await supabase
      .from("product_print_options")
      .select("*")
      .eq("variant_id", variantId);

    return { data, error };
  }

  return { getAllProductPrintOptions };
}
