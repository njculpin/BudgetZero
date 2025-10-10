"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateNotification() {
  const supabase = createClient();

  async function createNotification(notification: {
    user_id: string;
    notification_type:
      | "asset_reference_request"
      | "asset_reference_approved"
      | "asset_reference_rejected"
      | "collaborator_invite"
      | "collaborator_joined"
      | "project_published"
      | "order_received"
      | "payout_completed"
      | "payout_failed";
    title: string;
    message?: string;
    resource_type?: "project" | "asset" | "order" | "payout" | "collaborator";
    resource_id?: string;
    action_url?: string;
  }) {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    return { data, error };
  }

  return { createNotification };
}
