import { createClient } from "@/lib/supabase/server";

export async function useAdminGetProjectWithDetails(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_settings (*),
      project_tags (tag),
      creator:creator_id (id, full_name, username, email)
    `,
    )
    .eq("slug", slug)
    .single();

  return { data, error };
}
