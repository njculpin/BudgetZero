"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProjectAssetReference() {
  const supabase = createClient();

  async function createProjectAssetReference(reference: {
    project_id: string;
    asset_id: string;
    royalty_percentage?: number;
    status?: "pending" | "approved" | "rejected";
    requested_by: string;
  }) {
    const { data, error } = await supabase
      .from("project_asset_references")
      .insert(reference)
      .select(`
        *,
        project:project_id(id, title, slug),
        asset:asset_id(id, title, creator_id),
        requester:requested_by(id, full_name, username)
      `)
      .single();

    return { data, error };
  }

  return { createProjectAssetReference };
}
