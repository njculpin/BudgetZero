"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateProjectAssetReference() {
  const supabase = createClient();

  async function updateProjectAssetReference(
    id: string,
    updates: {
      royalty_percentage?: number;
      status?: "pending" | "approved" | "rejected";
      responded_at?: string;
      response_message?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("project_asset_references")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        project:project_id(id, title, slug),
        asset:asset_id(id, title, creator_id),
        requester:requested_by(id, full_name, username)
      `)
      .single();

    return { data, error };
  }

  return { updateProjectAssetReference };
}
