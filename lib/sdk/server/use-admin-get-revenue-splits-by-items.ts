import { createClient } from "@/lib/supabase/server";

export async function useAdminGetRevenueSplitsByItems(orderItemIds: string[]) {
  if (orderItemIds.length === 0) {
    return { data: [], error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("revenue_splits")
    .select("recipient_id, amount")
    .in("order_item_id", orderItemIds);

  return { data, error };
}
