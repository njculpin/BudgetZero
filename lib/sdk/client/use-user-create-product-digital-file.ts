"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProductDigitalFile() {
  const supabase = createClient();

  async function createProductDigitalFile(data: {
    variant_id: string;
    file_url: string;
    file_name: string;
    file_size_bytes?: number;
    file_format?: string;
    is_primary?: boolean;
  }) {
    const { data: result, error } = await supabase
      .from("product_digital_files")
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  return { createProductDigitalFile };
}
