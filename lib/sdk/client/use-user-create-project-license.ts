"use client";

import { createClient } from "@/lib/supabase/client";

export function useUserCreateProjectLicense() {
  const supabase = createClient();

  async function createProjectLicense(data: {
    project_id: string;
    license_type: "free" | "attribution" | "commercial" | "exclusive";
    license_terms?: string;
    is_active?: boolean;
    effective_from?: string;
    effective_until?: string;
  }) {
    const { data: license, error } = await supabase
      .from("project_licenses")
      .insert(data)
      .select()
      .single();

    return { data: license, error };
  }

  return { createProjectLicense };
}
