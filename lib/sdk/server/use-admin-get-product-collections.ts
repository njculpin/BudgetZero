import { createClient } from "@/lib/supabase/server";

export async function useAdminGetProductCollections() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_collections")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");

  return { data, error };
}
