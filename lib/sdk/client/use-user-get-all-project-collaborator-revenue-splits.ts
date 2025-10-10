"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProjectCollaboratorRevenueSplits() {
  const supabase = createClient();

  async function getCollaboratorRevenueSplits(collaborator_id: string) {
    const { data, error } = await supabase
      .from("project_collaborator_revenue_splits")
      .select("*")
      .eq("collaborator_id", collaborator_id)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  return { getCollaboratorRevenueSplits };
}
