import { createClient } from "@/lib/supabase/server";

export async function useAdminCheckWebhookEvent(stripeEventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", stripeEventId)
    .single();

  return { data, error };
}
