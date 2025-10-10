"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateLicense() {
  const supabase = createClient();

  async function updateLicense(
    id: string,
    updates: {
      title?: string;
      agreement?: string;
      is_platform_default?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from("licenses")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        creator:creator_id(id, full_name, username)
      `)
      .single();

    return { data, error };
  }

  return { updateLicense };
}
