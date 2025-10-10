"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProjectCollaboratorRevenueSplit() {
  const supabase = createClient();

  async function createCollaboratorRevenueSplit(data: {
    collaborator_id: string;
    percentage: number;
    is_active?: boolean;
    effective_from?: string;
    effective_until?: string;
  }) {
    const { data: split, error } = await supabase
      .from("project_collaborator_revenue_splits")
      .insert(data)
      .select()
      .single();

    return { data: split, error };
  }

  return { createCollaboratorRevenueSplit };
}
