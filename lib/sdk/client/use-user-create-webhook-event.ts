"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateWebhookEvent() {
  const supabase = createClient();

  async function createWebhookEvent(event: {
    event: string;
    event_type: string;
    payload: Record<string, unknown>;
    processed?: boolean;
    error_message?: string;
  }) {
    const { data, error } = await supabase
      .from("webhook_events")
      .insert(event)
      .select()
      .single();

    return { data, error };
  }

  return { createWebhookEvent };
}
