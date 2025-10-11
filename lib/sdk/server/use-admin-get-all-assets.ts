import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAllAssets(options?: {
  assetType?: string;
  search?: string;
  publicOnly?: boolean;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // Get public asset IDs and/or user's asset IDs
  let allowedAssetIds: string[] | undefined;

  if (options?.publicOnly || options?.userId) {
    const queries = [];

    // Get public assets
    if (options?.publicOnly || options?.userId) {
      queries.push(
        supabase
          .from("asset_settings")
          .select("asset_id")
          .eq("is_public", true)
      );
    }

    const results = await Promise.all(queries);
    const publicAssetIds = results[0]?.data?.map((s) => s.asset_id) || [];

    // If userId provided, get user's own assets
    let userAssetIds: string[] = [];
    if (options?.userId) {
      const { data: userAssets } = await supabase
        .from("assets")
        .select("id")
        .eq("creator_id", options.userId);

      userAssetIds = userAssets?.map((a) => a.id) || [];
    }

    // Combine public and user's assets
    allowedAssetIds = [...new Set([...publicAssetIds, ...userAssetIds])];

    if (allowedAssetIds.length === 0) {
      return { data: [], error: null, count: 0 };
    }
  }

  let query = supabase
    .from("assets")
    .select(
      `
      *,
      creator:creator_id(id, full_name, username, avatar_url),
      asset_preview_images(id, file_url, display_order),
      asset_pricing(id, pricing_type, price_cents, billing_interval, is_active)
    `,
      { count: "exact" },
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (allowedAssetIds) {
    query = query.in("id", allowedAssetIds);
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
