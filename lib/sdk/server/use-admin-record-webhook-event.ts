import { createClient } from "@/lib/supabase/server";

export async function useAdminRecordWebhookEvent(
  stripeEventId: string,
  eventType: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("webhook_events").insert({
    stripe_event_id: stripeEventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
  });

  return { data, error };
}
