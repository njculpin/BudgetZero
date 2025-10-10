import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { data: userData.user, error: userError };
  }
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  return { data, error };
}
