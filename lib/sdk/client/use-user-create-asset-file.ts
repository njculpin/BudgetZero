"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAssetFile() {
  const supabase = createClient();

  async function createAssetFile(file: {
    asset_id: string;
    file_url: string;
    file_size_bytes?: number;
    file_format?: string;
  }) {
    const { data, error } = await supabase
      .from("asset_files")
      .insert(file)
      .select()
      .single();

    return { data, error };
  }

  return { createAssetFile };
}
