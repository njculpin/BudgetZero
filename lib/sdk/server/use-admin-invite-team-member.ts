import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function useAdminInviteTeamMember(params: {
  teamId: string;
  email: string;
  role?: "admin" | "member";
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Unauthorized") };
  }

  const { teamId, email, role = "member" } = params;

  if (!email) {
    return { data: null, error: new Error("Email is required") };
  }

  // Validate role
  if (!["admin", "member"].includes(role)) {
    return { data: null, error: new Error("Invalid role") };
  }

  // Check if user is team creator (only creators can invite)
  const { data: team } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (!team || team.created_by !== user.id) {
    return {
      data: null,
      error: new Error("Only team creators can invite members"),
    };
  }

  // Check if invitee is already a user
  const { data: inviteeUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (inviteeUser) {
    // User exists - check if already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id, invitation_status")
      .eq("team_id", teamId)
      .eq("user_id", inviteeUser.id)
      .single();

    if (existingMember) {
      if (existingMember.invitation_status === "accepted") {
        return {
          data: null,
          error: new Error("User is already a team member"),
        };
      }
      if (existingMember.invitation_status === "pending") {
        return {
          data: null,
          error: new Error("User already has a pending invitation"),
        };
      }
    }

    // Create team member invitation
    const { data: teamMember, error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: inviteeUser.id,
        role,
        invitation_status: "pending",
        invited_by: user.id,
      })
      .select()
      .single();

    return { data: teamMember, error };
  } else {
    // User doesn't exist - create email invitation
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    return { data: invitation, error };
  }
}
