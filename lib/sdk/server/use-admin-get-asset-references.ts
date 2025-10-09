import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAssetReferences(options: {
  assetIds: string[];
  status?: "pending" | "approved" | "rejected";
}) {
  const supabase = await createClient();

  if (options.assetIds.length === 0) {
    return { data: [], error: null };
  }

  let query = supabase
    .from("project_asset_references")
    .select("id, royalty_percentage, status, requested_at, asset_id, project_id")
    .in("asset_id", options.assetIds)
    .order("requested_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  return { data, error };
}
