"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProductCollections() {
  const supabase = createClient();

  async function getAllProductCollections(filters?: {
    is_visible?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from("product_collections")
      .select("*", { count: "exact" })
      .order("display_order", { ascending: true });

    if (filters?.is_visible !== undefined) {
      query = query.eq("is_visible", filters.is_visible);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }

    const { data, error, count } = await query;

    return { data, error, count };
  }

  return { getAllProductCollections };
}
