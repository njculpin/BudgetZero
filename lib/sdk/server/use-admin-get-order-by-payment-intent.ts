import { createClient } from "@/lib/supabase/server";

export async function useAdminGetOrderByPaymentIntent(paymentIntentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, buyer_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  return { data, error };
}
