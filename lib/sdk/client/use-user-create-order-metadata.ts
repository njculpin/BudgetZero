"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateOrderMetadata() {
  const supabase = createClient();

  async function createOrderMetadata(
    order_id: string,
    key: string,
    value: string,
  ) {
    const { data, error } = await supabase
      .from("order_metadata")
      .insert({ order_id, key, value })
      .select()
      .single();

    return { data, error };
  }

  return { createOrderMetadata };
}
