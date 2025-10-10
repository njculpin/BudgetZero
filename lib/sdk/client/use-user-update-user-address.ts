"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserUpdateUserAddress() {
  const supabase = createClient();

  async function updateUserAddress(
    id: string,
    updates: {
      address_type?: "shipping" | "billing" | "both";
      is_primary?: boolean;
      full_name?: string;
      company_name?: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      state_province?: string;
      postal_code?: string;
      country_code?: string;
      phone?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("users_addresses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  return { updateUserAddress };
}
