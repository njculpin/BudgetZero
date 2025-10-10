"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAssetTag() {
  const supabase = createClient();

  async function createAssetTag(asset_id: string, tag: string) {
    const { data, error } = await supabase
      .from("asset_tags")
      .insert({ asset_id, tag })
      .select()
      .single();

    return { data, error };
  }

  return { createAssetTag };
}
