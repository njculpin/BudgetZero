import { createClient } from "@/lib/supabase/server";

export async function useAdminCountUserProjects(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", userId);

  return { count, error };
}
