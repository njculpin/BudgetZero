"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateAsset() {
  const supabase = createClient();

  async function updateAsset(
    id: string,
    updates: {
      project_id?: string;
      title?: string;
      description?: string;
      thumbnail_url?: string;
      preview_url?: string;
      status?: "draft" | "active" | "archived" | "published";
    },
  ) {
    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project:project_id(id, title, slug),
        asset_settings(*),
        asset_stats(*)
      `)
      .single();

    return { data, error };
  }

  return { updateAsset };
}
