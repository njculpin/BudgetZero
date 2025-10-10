import { createClient } from "@/lib/supabase/server";

export async function useAdminGetRoyaltiesByIds(royaltyIds: string[]) {
  if (royaltyIds.length === 0) {
    return { data: [], error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("asset_royalties")
    .select("id, percentage")
    .in("id", royaltyIds);

  return { data, error };
}
