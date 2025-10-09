import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAssetById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select(
      `
      *,
      creator:creator_id(id, full_name, username, avatar_url),
      asset_settings(*),
      asset_stats(*),
      asset_tags(tag),
      asset_images(*),
      asset_files(*),
      asset_royalties(*),
      asset_licenses(*)
    `,
    )
    .eq("id", id)
    .single();

  return { data, error };
}
