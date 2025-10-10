import { createClient } from "@/lib/supabase/server";

export async function useAdminGetConnectedAccount(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  return { data, error };
}
