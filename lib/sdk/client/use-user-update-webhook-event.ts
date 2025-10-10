"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateWebhookEvent() {
  const supabase = createClient();

  async function updateWebhookEvent(
    id: string,
    updates: {
      processed?: boolean;
      processed_at?: string;
      error_message?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("webhook_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  async function markAsProcessed(id: string) {
    return updateWebhookEvent(id, {
      processed: true,
      processed_at: new Date().toISOString(),
    });
  }

  return { updateWebhookEvent, markAsProcessed };
}
