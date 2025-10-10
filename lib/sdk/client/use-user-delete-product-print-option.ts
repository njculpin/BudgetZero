"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteProductPrintOption() {
  const supabase = createClient();

  async function deleteProductPrintOption(id: string) {
    const { error } = await supabase
      .from("product_print_options")
      .delete()
      .eq("id", id);

    return { error };
  }

  return { deleteProductPrintOption };
}
