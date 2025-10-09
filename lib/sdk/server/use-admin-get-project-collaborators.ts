import { createClient } from "@/lib/supabase/server";

export async function useAdminGetProjectCollaborators(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_collaborators")
    .select(
      `
      id,
      contribution_description,
      joined_at,
      user:user_id (id, full_name, username, email, avatar_url)
    `,
    )
    .eq("project_id", projectId)
    .eq("is_active", true)
    .eq("invitation_status", "accepted")
    .order("joined_at", { ascending: true });

  return { data, error };
}
