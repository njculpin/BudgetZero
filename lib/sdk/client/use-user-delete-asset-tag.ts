"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteAssetTag() {
  const supabase = createClient();

  async function deleteAssetTag(id: string) {
    const { error } = await supabase.from("asset_tags").delete().eq("id", id);

    return { error };
  }

  return { deleteAssetTag };
}
