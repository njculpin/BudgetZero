import { createClient } from "@/lib/supabase/server";

export async function useAdminGetOrderItems(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId);

  return { data, error };
}
