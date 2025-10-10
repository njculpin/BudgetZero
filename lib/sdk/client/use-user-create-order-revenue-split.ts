"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateOrderRevenueSplit() {
  const supabase = createClient();

  async function createOrderRevenueSplit(split: {
    order_id: string;
    recipient_id: string;
    split_type:
      | "platform_fee"
      | "asset_royalty"
      | "collaborator_share"
      | "project_creator";
    resource_id?: string;
    resource_type?: "asset" | "project" | "platform";
    amount_cents: number;
    percentage: number;
    status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
    stripe_transfer_id?: string;
  }) {
    const { data, error } = await supabase
      .from("order_revenue_splits")
      .insert(split)
      .select(`
        *,
        order:order_id(id, order_number, total_cents),
        recipient:recipient_id(id, full_name, username, email)
      `)
      .single();

    return { data, error };
  }

  return { createOrderRevenueSplit };
}
