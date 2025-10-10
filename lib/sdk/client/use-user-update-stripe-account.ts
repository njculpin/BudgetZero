"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateStripeAccount() {
  const supabase = createClient();

  async function updateStripeAccount(
    userId: string,
    updates: {
      account_type?: "express" | "standard";
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      details_submitted?: boolean;
      country?: string;
      currency?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("stripe_connected_accounts")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    return { data, error };
  }

  return { updateStripeAccount };
}
