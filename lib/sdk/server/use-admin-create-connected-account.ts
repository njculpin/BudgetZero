import { createClient } from "@/lib/supabase/server";

export async function useAdminCreateConnectedAccount(data: {
  user_id: string;
  stripe_account_id: string;
  account_type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("stripe_connected_accounts")
    .insert(data);

  return { data: result, error };
}
