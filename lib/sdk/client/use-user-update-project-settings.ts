"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateProjectSettings() {
  const supabase = createClient();

  async function updateProjectSettings(
    project_id: string,
    updates: {
      is_public?: boolean;
      allow_comments?: boolean;
      allow_forks?: boolean;
      allow_downloads?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from("project_settings")
      .update(updates)
      .eq("project_id", project_id)
      .select()
      .single();

    return { data, error };
  }

  return { updateProjectSettings };
}
