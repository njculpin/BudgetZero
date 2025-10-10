"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdatePayoutSchedule() {
  const supabase = createClient();

  async function updatePayoutSchedule(
    userId: string,
    updates: {
      enabled?: boolean;
      frequency?: "weekly" | "biweekly" | "monthly";
      minimum_amount?: number;
      day_of_month?: number;
      last_payout_at?: string;
      next_payout_at?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("payout_schedules")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    return { data, error };
  }

  return { updatePayoutSchedule };
}
