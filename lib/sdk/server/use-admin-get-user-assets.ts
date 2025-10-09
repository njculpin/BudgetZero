import { createClient } from "@/lib/supabase/server";

export async function useAdminGetUserAssets(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("id")
    .eq("creator_id", userId);

  return { data, error };
}
