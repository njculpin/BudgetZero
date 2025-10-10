"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProductPrintOption() {
  const supabase = createClient();

  async function createProductPrintOption(data: {
    variant_id: string;
    printer_integration_id: string;
    print_template_id?: string;
    paper_type?: string;
    finish_type?: string;
    dimensions?: string;
  }) {
    const { data: result, error } = await supabase
      .from("product_print_options")
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  return { createProductPrintOption };
}
