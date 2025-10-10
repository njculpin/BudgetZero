"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProjectTag() {
  const supabase = createClient();

  async function createProjectTag(project_id: string, tag: string) {
    const { data, error } = await supabase
      .from("project_tags")
      .insert({ project_id, tag })
      .select()
      .single();

    return { data, error };
  }

  return { createProjectTag };
}
