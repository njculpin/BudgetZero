"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProjects() {
  const supabase = createClient();

  async function getProjects(options?: {
    creatorId?: string;
    status?: "draft" | "active" | "archived" | "published";
    isPublic?: boolean;
    seekingCollaborators?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from("projects")
      .select(
        `
        *,
        creator:creator_id(id, full_name, username, avatar_url)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (options?.creatorId) {
      query = query.eq("creator_id", options.creatorId);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic);
    }

    if (options?.seekingCollaborators !== undefined) {
      query = query.eq("seeking_collaborators", options.seekingCollaborators);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1,
      );
    }

    const { data, error, count } = await query;

    return { data, error, count };
  }

  return { getProjects };
}
