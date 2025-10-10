"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserGetAllUsers() {
  const supabase = createClient();

  async function getUsers(options?: {
    isActive?: boolean;
    isVerified?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive);
    }

    if (options?.isVerified !== undefined) {
      query = query.eq("is_verified", options.isVerified);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1,
      );
    }

    const { data, error, count } = await query;

    return { data, error, count };
  }

  return { getUsers };
}
