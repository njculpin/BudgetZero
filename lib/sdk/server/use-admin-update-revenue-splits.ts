import { createClient } from "@/lib/supabase/server";

export async function useAdminUpdateRevenueSplits(
  orderItemIds: string[],
  status: string,
) {
  if (orderItemIds.length === 0) {
    return { data: null, error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("revenue_splits")
    .update({ status })
    .in("order_item_id", orderItemIds);

  return { data, error };
}
