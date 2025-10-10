"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateAssetComment() {
  const supabase = createClient();

  async function createAssetComment(comment: {
    asset_id: string;
    author_id: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from("asset_comments")
      .insert(comment)
      .select(`
        *,
        author:author_id(id, full_name, username, avatar_url)
      `)
      .single();

    return { data, error };
  }

  return { createAssetComment };
}
