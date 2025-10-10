"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateUserLink() {
  const supabase = createClient();

  async function updateUserLink(
    id: string,
    updates: {
      title?: string;
      url?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("users_links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateUserLink };
}
