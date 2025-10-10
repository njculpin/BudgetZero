"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateAssetLicense() {
  const supabase = createClient();

  async function updateAssetLicense(
    id: string,
    updates: {
      license_type?: "free" | "attribution" | "commercial" | "exclusive";
      license_terms?: string;
      is_active?: boolean;
      effective_until?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("asset_licenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateAssetLicense };
}
