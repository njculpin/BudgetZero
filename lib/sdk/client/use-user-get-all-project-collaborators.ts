"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProjectCollaborators() {
  const supabase = createClient();

  async function getProjectCollaborators(
    projectId: string,
    options?: {
      invitationStatus?: "pending" | "accepted" | "declined" | "revoked";
      isActive?: boolean;
    },
  ) {
    let query = supabase
      .from("project_collaborators")
      .select(`
        *,
        user:user_id(id, full_name, username, avatar_url),
        inviter:invited_by(id, full_name, username)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (options?.invitationStatus) {
      query = query.eq("invitation_status", options.invitationStatus);
    }

    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive);
    }

    const { data, error } = await query;

    return { data, error };
  }

  return { getProjectCollaborators };
}
