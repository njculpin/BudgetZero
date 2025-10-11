import { createClient } from "@/lib/supabase/server";

export async function useAdminGetActiveAssetPricing(assetId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("asset_pricing")
    .select("*")
    .eq("asset_id", assetId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
}
