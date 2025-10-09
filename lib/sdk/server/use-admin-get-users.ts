import { createClient } from "@/lib/supabase/server";

export async function useAdminGetUsers(userIds: string[]) {
  const supabase = await createClient();

  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, username");

  return { data, error };
}
