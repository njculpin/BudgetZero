import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAssets(assetIds: string[]) {
  const supabase = await createClient();

  if (assetIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("assets")
    .select("id, title, asset_type, thumbnail_url, creator_id")
    .in("id", assetIds);

  return { data, error };
}
