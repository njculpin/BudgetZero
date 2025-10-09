import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAssetRoyalties(royaltyIds: string[]) {
  const supabase = await createClient();

  if (royaltyIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("asset_royalties")
    .select("id, percentage")
    .in("id", royaltyIds);

  return { data, error };
}
