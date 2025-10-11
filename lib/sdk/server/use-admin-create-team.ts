import { createClient } from "@/lib/supabase/server";

// Helper to create URL-safe slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function useAdminCreateTeam(params: {
  name: string;
  description?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Unauthorized") };
  }

  const { name, description } = params;

  if (!name) {
    return { data: null, error: new Error("Team name is required") };
  }

  // Generate unique slug
  let slug = createSlug(name);
  let slugSuffix = 0;
  let finalSlug = slug;

  while (true) {
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("slug", finalSlug)
      .single();

    if (!existing) break;

    slugSuffix++;
    finalSlug = `${slug}-${slugSuffix}`;
  }

  // Create team (team creator is automatically added as owner via trigger)
  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name,
      slug: finalSlug,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single();

  return { data: team, error };
}
