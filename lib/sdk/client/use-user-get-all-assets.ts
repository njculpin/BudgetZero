"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllAssets() {
  const supabase = createClient();

  async function getAssets(options?: {
    creatorId?: string;
    projectId?: string;
    status?: "draft" | "active" | "archived" | "published";
    isPublic?: boolean;
    isFeatured?: boolean;
    seekingCollaborators?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from("assets")
      .select(
        `
        *,
        creator:creator_id(id, full_name, username, avatar_url),
        project:project_id(id, title, slug)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (options?.creatorId) {
      query = query.eq("creator_id", options.creatorId);
    }

    if (options?.projectId) {
      query = query.eq("project_id", options.projectId);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic);
    }

    if (options?.isFeatured !== undefined) {
      query = query.eq("is_featured", options.isFeatured);
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

  return { getAssets };
}
