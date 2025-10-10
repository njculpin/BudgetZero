"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteAssetLicense() {
  const supabase = createClient();

  async function deleteAssetLicense(id: string) {
    const { error } = await supabase
      .from("asset_licenses")
      .delete()
      .eq("id", id);

    return { error };
  }

  return { deleteAssetLicense };
}
