import { createClient } from "@/lib/supabase/server";

export async function useAdminUpdateOrder(
  orderId: string,
  updates: {
    status?: string;
    stripe_payment_intent_id?: string;
    completed_at?: string;
  },
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  return { data, error };
}
