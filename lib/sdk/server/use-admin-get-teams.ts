import { createClient } from "@/lib/supabase/server";

export async function useAdminGetTeams() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Unauthorized") };
  }

  const { data: teams, error } = await supabase
    .from("teams")
    .select(
      `
      *,
      team_members!inner(role, invitation_status, joined_at)
    `,
    )
    .eq("team_members.user_id", user.id)
    .eq("team_members.invitation_status", "accepted")
    .order("created_at", { ascending: false });

  return { data: teams, error };
}
