"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAsset() {
  const supabase = createClient();

  async function createAsset(asset: {
    creator_id: string;
    project_id?: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    preview_url?: string;
    tags?: string[];
    status?: "draft" | "active" | "archived" | "published";
    license_type?: "free" | "attribution" | "commercial" | "exclusive";
    license_terms?: string;
    royalty_percentage?: number;
    is_public?: boolean;
    is_featured?: boolean;
    seeking_collaborators?: boolean;
  }) {
    const { data, error } = await supabase
      .from("assets")
      .insert(asset)
      .select(`
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project:project_id(id, title, slug)
      `)
      .single();

    return { data, error };
  }

  return { createAsset };
}
