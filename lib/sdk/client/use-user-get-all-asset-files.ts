"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllAssetFiles() {
  const supabase = createClient();

  async function getAssetFiles(assetId: string) {
    const { data, error } = await supabase
      .from("asset_files")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  return { getAssetFiles };
}
