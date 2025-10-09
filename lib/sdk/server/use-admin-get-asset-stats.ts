import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAssetStats(assetIds: string[]) {
  const supabase = await createClient();

  if (assetIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("asset_stats")
    .select("view_count, download_count")
    .in("asset_id", assetIds);

  return { data, error };
}
