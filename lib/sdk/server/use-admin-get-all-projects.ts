import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAllProjects(options?: {
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
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  return { data, error, count };
}
