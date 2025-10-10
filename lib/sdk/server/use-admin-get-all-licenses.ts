import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAllLicenses(options?: {
  creatorId?: string;
  isPlatformDefault?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("licenses")
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

  if (options?.isPlatformDefault !== undefined) {
    query = query.eq("is_platform_default", options.isPlatformDefault);
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  return { data, error, count };
}
