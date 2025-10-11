import { createClient } from "@/lib/supabase/server";

export async function useAdminGetTeamInvitations(teamId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: authError || new Error("Unauthorized"),
    };
  }

  // Check if user is team member
  const { data: team } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (!team || team.created_by !== user.id) {
    return {
      data: null,
      error: new Error("You must be the team creator to view invitations"),
    };
  }

  // Get pending team members
  const { data: pendingMembers } = await supabase
    .from("team_members")
    .select(
      `
      *,
      users!team_members_user_id_fkey(id, email, full_name)
    `,
    )
    .eq("team_id", teamId)
    .eq("invitation_status", "pending");

  // Get email invitations
  const { data: emailInvitations } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "pending");

  return {
    data: {
      pendingMembers: pendingMembers || [],
      emailInvitations: emailInvitations || [],
    },
    error: null,
  };
}
