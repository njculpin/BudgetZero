import { createClient } from "@/lib/supabase/server";

export async function useAdminGetProjects(projectIds: string[]) {
  const supabase = await createClient();

  if (projectIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, creator_id");

  return { data, error };
}
