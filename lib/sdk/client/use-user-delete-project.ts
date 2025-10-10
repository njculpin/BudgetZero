"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserDeleteProject() {
  const supabase = createClient();

  async function deleteProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    return { error };
  }

  return { deleteProject };
}
