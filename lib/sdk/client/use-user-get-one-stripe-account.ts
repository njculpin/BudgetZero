"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetOneStripeAccount() {
  const supabase = createClient();

  async function getStripeAccount(userId: string) {
    const { data, error } = await supabase
      .from("stripe_connected_accounts")
      .select("*")
      .eq("user_id", userId)
      .single();

    return { data, error };
  }

  async function getStripeAccountById(id: string) {
    const { data, error } = await supabase
      .from("stripe_connected_accounts")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  }

  return { getStripeAccount, getStripeAccountById };
}
