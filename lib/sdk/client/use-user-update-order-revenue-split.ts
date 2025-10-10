"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateOrderRevenueSplit() {
  const supabase = createClient();

  async function updateOrderRevenueSplit(
    id: string,
    updates: {
      status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
      stripe_transfer_id?: string;
      paid_at?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("order_revenue_splits")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        order:order_id(id, order_number, total_cents),
        recipient:recipient_id(id, full_name, username, email)
      `)
      .single();

    return { data, error };
  }

  return { updateOrderRevenueSplit };
}
