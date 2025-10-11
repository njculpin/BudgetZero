import { createClient } from "@/lib/supabase/server";

export async function useAdminUpdateAsset(params: {
  assetId: string;
  title?: string;
  description?: string;
  is_public?: boolean;
  royalty_percentage?: number;
  royalty_notes?: string;
  license_type?: "free" | "attribution" | "commercial" | "exclusive";
  license_terms?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Unauthorized") };
  }

  const {
    assetId,
    title,
    description,
    is_public,
    royalty_percentage,
    royalty_notes,
    license_type,
    license_terms,
  } = params;

  // Verify ownership
  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("creator_id")
    .eq("id", assetId)
    .single();

  if (fetchError || !asset) {
    return { data: null, error: fetchError || new Error("Asset not found") };
  }

  if (asset.creator_id !== user.id) {
    return { data: null, error: new Error("Forbidden") };
  }

  // Update asset basic info
  if (title !== undefined || description !== undefined) {
    const updates: Record<string, string | null> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const { error: updateError } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", assetId);

    if (updateError) {
      return { data: null, error: updateError };
    }
  }

  // Update asset settings
  if (is_public !== undefined) {
    const { error: settingsError } = await supabase
      .from("asset_settings")
      .update({ is_public })
      .eq("asset_id", assetId);

    if (settingsError) {
      console.error("Settings update error:", settingsError);
    }
  }

  // Update or create royalty
  if (royalty_percentage !== undefined) {
    await supabase
      .from("asset_royalties")
      .update({ is_active: false })
      .eq("asset_id", assetId);

    if (royalty_percentage > 0) {
      const { error: royaltyError } = await supabase
        .from("asset_royalties")
        .insert({
          asset_id: assetId,
          percentage: royalty_percentage,
          notes: royalty_notes || null,
          is_active: true,
        });

      if (royaltyError) {
        console.error("Royalty creation error:", royaltyError);
      }
    }
  }

  // Update or create license
  if (license_type !== undefined) {
    await supabase
      .from("asset_licenses")
      .update({ is_active: false })
      .eq("asset_id", assetId);

    const { error: licenseError } = await supabase
      .from("asset_licenses")
      .insert({
        asset_id: assetId,
        license_type,
        license_terms: license_terms || null,
        is_active: true,
      });

    if (licenseError) {
      console.error("License creation error:", licenseError);
    }
  }

  return { data: { success: true }, error: null };
}
