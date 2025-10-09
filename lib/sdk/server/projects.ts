import { createClient } from "@/lib/supabase/server";

export async function getProjectBySlug(slug: string) {
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

export async function getAllProjects(options?: {
  creatorId?: string;
  status?: "draft" | "active" | "archived" | "published";
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select(
      `
      *,
      project_settings (*),
      project_tags (tag)
    `,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });

  if (options?.creatorId) {
    query = query.eq("creator_id", options.creatorId);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(
      options.offset,
      options.offset + options.limit - 1,
    );
  }

  const { data, error, count } = await query;

  return { data, error, count };
}

export async function getProjectAssets(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("id, title, asset_type, thumbnail_url, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getProjectCollaborators(projectId: string) {
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

export async function getProjectAssetReferences(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_asset_references")
    .select("id, asset_id, asset_royalty_id, status")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return { data, error };
}
