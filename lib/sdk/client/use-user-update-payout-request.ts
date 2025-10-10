"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdatePayoutRequest() {
  const supabase = createClient();

  async function updatePayoutRequest(
    id: string,
    updates: {
      status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
      stripe_transfer_id?: string;
      processed_at?: string;
      completed_at?: string;
      error_message?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("payout_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updatePayoutRequest };
}
