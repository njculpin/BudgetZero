"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteAssetImage() {
  const supabase = createClient();

  async function deleteAssetImage(id: string) {
    const { error } = await supabase.from("asset_images").delete().eq("id", id);

    return { error };
  }

  return { deleteAssetImage };
}
