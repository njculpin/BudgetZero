"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneProjectStats() {
  const supabase = createClient();

  async function getProjectStats(project_id: string) {
    const { data, error } = await supabase
      .from("project_stats")
      .select("*")
      .eq("project_id", project_id)
      .single();

    return { data, error };
  }

  return { getProjectStats };
}
