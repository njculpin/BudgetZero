"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateProjectCollaboratorRevenueSplit() {
  const supabase = createClient();

  async function updateCollaboratorRevenueSplit(
    id: string,
    updates: {
      percentage?: number;
      is_active?: boolean;
      effective_until?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("project_collaborator_revenue_splits")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateCollaboratorRevenueSplit };
}
