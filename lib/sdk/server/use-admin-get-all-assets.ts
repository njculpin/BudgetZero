import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAllAssets(options?: {
  assetType?: string;
  search?: string;
  publicOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // First get public asset IDs if needed
  let publicAssetIds: string[] | undefined;
  if (options?.publicOnly) {
    const { data: settings } = await supabase
      .from("asset_settings")
      .select("asset_id")
      .eq("is_public", true);

    publicAssetIds = settings?.map((s) => s.asset_id) || [];

    if (publicAssetIds.length === 0) {
      return { data: [], error: null, count: 0 };
    }
  }

  let query = supabase
    .from("assets")
    .select(
      `
      *,
      creator:creator_id(id, full_name, username, avatar_url)
    `,
      { count: "exact" },
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (publicAssetIds) {
    query = query.in("id", publicAssetIds);
  }

  if (options?.assetType) {
    query = query.eq("asset_type", options.assetType);
  }

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  return { data, error, count };
}
