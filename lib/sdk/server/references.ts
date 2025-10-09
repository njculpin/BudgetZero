import { createClient } from "@/lib/supabase/server";

export async function getAssetReferences(options: {
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

export async function getAssets(assetIds: string[]) {
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

export async function getProjects(projectIds: string[]) {
  const supabase = await createClient();

  if (projectIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, creator_id");

  return { data, error };
}

export async function getUsers(userIds: string[]) {
  const supabase = await createClient();

  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, username");

  return { data, error };
}

export async function getAssetRoyalties(royaltyIds: string[]) {
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
