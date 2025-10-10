"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneAsset() {
  const supabase = createClient();

  async function getAsset(id: string) {
    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project:project_id(id, title, slug),
        asset_images(*),
        asset_files(*),
        asset_settings(*),
        asset_royalties(*, is_active),
        asset_licenses(*, is_active),
        asset_tags(*),
        asset_stats(*)
      `)
      .eq("id", id)
      .single();

    return { data, error };
  }

  return { getAsset };
}
