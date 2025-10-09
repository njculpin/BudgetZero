"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetMe() {
  const supabase = createClient();

  async function getUser() {
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

  return { getUser };
}
