"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteAssetComment() {
  const supabase = createClient();

  async function deleteAssetComment(id: string) {
    const { error } = await supabase
      .from("asset_comments")
      .delete()
      .eq("id", id);

    return { error };
  }

  return { deleteAssetComment };
}
