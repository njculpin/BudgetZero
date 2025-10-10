"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateAssetLicenseGrant() {
  const supabase = createClient();

  async function updateAssetLicenseGrant(
    id: string,
    updates: {
      expires_at?: string;
      is_active?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from("asset_license_grants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateAssetLicenseGrant };
}
