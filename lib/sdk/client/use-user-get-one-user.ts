"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneUser() {
  const supabase = createClient();

  async function getUser(id: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  }

  return { getUser };
}
