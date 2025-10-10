"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProjectPricing() {
  const supabase = createClient();

  async function createProjectPricing(pricing: {
    project_id: string;
    name: string;
    description?: string;
    price_cents: number;
    is_active?: boolean;
  }) {
    const { data, error } = await supabase
      .from("project_pricing")
      .insert(pricing)
      .select()
      .single();

    return { data, error };
  }

  return { createProjectPricing };
}
