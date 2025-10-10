"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllAssetRoyalties() {
  const supabase = createClient();

  async function getAssetRoyalties(asset_id: string) {
    const { data, error } = await supabase
      .from("asset_royalties")
      .select("*")
      .eq("asset_id", asset_id)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  return { getAssetRoyalties };
}
