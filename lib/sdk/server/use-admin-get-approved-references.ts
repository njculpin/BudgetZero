import { createClient } from "@/lib/supabase/server";

export async function useAdminGetApprovedReferences(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_asset_references")
    .select("id, asset_id, asset_royalty_id, status")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return { data, error };
}
