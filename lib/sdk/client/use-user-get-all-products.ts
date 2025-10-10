"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllProducts() {
  const supabase = createClient();

  async function getAllProducts(filters?: {
    status?: string;
    is_featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        product_images!inner (file_url, is_primary),
        product_tags (tag)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq("is_featured", filters.is_featured);
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

  return { getAllProducts };
}
