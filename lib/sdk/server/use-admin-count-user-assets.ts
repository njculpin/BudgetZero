import { createClient } from "@/lib/supabase/server";

export async function useAdminCountUserAssets(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", userId);

  return { count, error };
}
