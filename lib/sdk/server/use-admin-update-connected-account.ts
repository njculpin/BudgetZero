import { createClient } from "@/lib/supabase/server";

export async function useAdminUpdateConnectedAccount(
  userId: string,
  updates: {
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
    country?: string | null;
    currency?: string | null;
    updated_at?: string;
  },
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .update(updates)
    .eq("user_id", userId);

  return { data, error };
}
