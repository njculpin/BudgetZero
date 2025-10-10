import { createClient } from "@/lib/supabase/server";

export async function useAdminGetOrderDetails(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      order_number,
      buyer_id,
      order_items (
        project_id,
        project_title
      )
    `,
    )
    .eq("id", orderId)
    .single();

  return { data, error };
}
