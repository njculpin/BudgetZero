import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAssetPricing(assetId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("asset_pricing")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });

  return { data, error };
}
