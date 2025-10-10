"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAssetLicense() {
  const supabase = createClient();

  async function createAssetLicense(assetLicense: {
    licensor_id: string;
    licensee_id: string;
    asset_id: string;
    license_id: string;
  }) {
    const { data, error } = await supabase
      .from("asset_licenses")
      .insert(assetLicense)
      .select(`
        *,
        licensor:licensor_id(id, full_name, username),
        licensee:licensee_id(id, full_name, username),
        asset:asset_id(id, title),
        license:license_id(id, title)
      `)
      .single();

    return { data, error };
  }

  return { createAssetLicense };
}
