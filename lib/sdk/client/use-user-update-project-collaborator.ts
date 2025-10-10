"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateProjectCollaborator() {
  const supabase = createClient();

  async function updateProjectCollaborator(
    id: string,
    updates: {
      invitation_status?: "pending" | "accepted" | "declined" | "revoked";
      permissions?: string[];
      revenue_percentage?: number;
      contribution_description?: string;
      is_active?: boolean;
      joined_at?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("project_collaborators")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        user:user_id(id, full_name, username, avatar_url),
        inviter:invited_by(id, full_name, username)
      `)
      .single();

    return { data, error };
  }

  return { updateProjectCollaborator };
}
