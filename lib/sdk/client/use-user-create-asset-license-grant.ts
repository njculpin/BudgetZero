"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAssetLicenseGrant() {
  const supabase = createClient();

  async function createAssetLicenseGrant(data: {
    licensor_id: string;
    licensee_id: string;
    asset_id: string;
    license_id: string;
    granted_at?: string;
    expires_at?: string;
    is_active?: boolean;
  }) {
    const { data: grant, error } = await supabase
      .from("asset_license_grants")
      .insert(data)
      .select(`
        *,
        licensor:licensor_id(id, full_name, username, avatar_url),
        licensee:licensee_id(id, full_name, username, avatar_url),
        asset:asset_id(id, title),
        license:license_id(id, title)
      `)
      .single();

    return { data: grant, error };
  }

  return { createAssetLicenseGrant };
}
