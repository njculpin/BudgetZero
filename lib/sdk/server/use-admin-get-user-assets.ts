import { createClient } from "@/lib/supabase/server";

export async function useAdminGetUserAssets(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select(
      `
      id,
      title,
      asset_type,
      thumbnail_url,
      preview_url,
      status,
      asset_preview_images(id, file_url, display_order)
    `,
    )
    .eq("creator_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return { data, error };
}
