"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneLicense() {
  const supabase = createClient();

  async function getLicense(id: string) {
    const { data, error } = await supabase
      .from("licenses")
      .select(`
        *,
        creator:creator_id(id, full_name, username)
      `)
      .eq("id", id)
      .single();

    return { data, error };
  }

  return { getLicense };
}
