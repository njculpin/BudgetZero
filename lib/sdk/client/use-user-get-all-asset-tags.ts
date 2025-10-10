"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllAssetTags() {
  const supabase = createClient();

  async function getAssetTags(asset_id: string) {
    const { data, error } = await supabase
      .from("asset_tags")
      .select("*")
      .eq("asset_id", asset_id)
      .order("tag", { ascending: true });

    return { data, error };
  }

  return { getAssetTags };
}
