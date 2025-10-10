"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductProjects() {
  const supabase = createClient();

  async function getAllProductProjects(productId: string) {
    const { data, error } = await supabase
      .from("product_projects")
      .select(`
        *,
        projects (*)
      `)
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    return { data, error };
  }

  return { getAllProductProjects };
}
