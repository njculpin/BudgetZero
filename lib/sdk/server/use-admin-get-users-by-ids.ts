import { createClient } from "@/lib/supabase/server";

export async function useAdminGetUsersByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, username")
    .in("id", userIds);

  return { data, error };
}
