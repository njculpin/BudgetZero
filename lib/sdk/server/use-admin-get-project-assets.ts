import { createClient } from "@/lib/supabase/server";

export async function useAdminGetProjectAssets(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("id, title, asset_type, thumbnail_url, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return { data, error };
}
