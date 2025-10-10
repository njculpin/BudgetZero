"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllAssetLicenseGrants() {
  const supabase = createClient();

  async function getAssetLicenseGrants(asset_id: string) {
    const { data, error } = await supabase
      .from("asset_license_grants")
      .select(`
        *,
        licensor:licensor_id(id, full_name, username, avatar_url),
        licensee:licensee_id(id, full_name, username, avatar_url),
        asset:asset_id(id, title),
        license:license_id(id, title)
      `)
      .eq("asset_id", asset_id)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  return { getAssetLicenseGrants };
}
