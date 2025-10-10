"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllUserLinks() {
  const supabase = createClient();

  async function getUserLinks(userId: string) {
    const { data, error } = await supabase
      .from("users_links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  return { getUserLinks };
}
