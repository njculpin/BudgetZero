"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreatePayoutRequest() {
  const supabase = createClient();

  async function createPayoutRequest(request: {
    user_id: string;
    amount: number;
    status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
    stripe_transfer_id?: string;
  }) {
    const { data, error } = await supabase
      .from("payout_requests")
      .insert(request)
      .select()
      .single();

    return { data, error };
  }

  return { createPayoutRequest };
}
