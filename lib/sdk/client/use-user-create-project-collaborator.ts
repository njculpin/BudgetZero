"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProjectCollaborator() {
  const supabase = createClient();

  async function createProjectCollaborator(collaborator: {
    project_id: string;
    user_id: string;
    invitation_status?: "pending" | "accepted" | "declined" | "revoked";
    permissions?: string[];
    revenue_percentage?: number;
    contribution_description?: string;
    is_active?: boolean;
    invited_by?: string;
  }) {
    const { data, error } = await supabase
      .from("project_collaborators")
      .insert(collaborator)
      .select(`
        *,
        user:user_id(id, full_name, username, avatar_url),
        inviter:invited_by(id, full_name, username)
      `)
      .single();

    return { data, error };
  }

  return { createProjectCollaborator };
}
