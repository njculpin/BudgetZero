"use server";

import { revalidatePath } from "next/cache";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";

export async function updateAsset(
  assetId: string,
  data: {
    title: string;
    description?: string;
    is_public: boolean;
  },
) {
  try {
    const user = await getMe();
    const supabase = await createClient();

    // Verify ownership
    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("user_id")
      .eq("id", assetId)
      .single();

    if (fetchError || !asset) {
      return { success: false, error: "Asset not found" };
    }

    if (asset.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update asset
    const { error: updateError } = await supabase
      .from("assets")
      .update({
        title: data.title,
        description: data.description || null,
        is_public: data.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/assets");

    return { success: true };
  } catch (error) {
    console.error("Update asset error:", error);
    return { success: false, error: "Failed to update asset" };
  }
}

export async function deleteAsset(assetId: string) {
  try {
    const user = await getMe();
    const supabase = await createClient();

    // Verify ownership
    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("user_id")
      .eq("id", assetId)
      .single();

    if (fetchError || !asset) {
      return { success: false, error: "Asset not found" };
    }

    if (asset.user_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all files and images to delete from storage
    const { data: files } = await supabase
      .from("asset_files")
      .select("storage_path")
      .eq("asset_id", assetId)
      .eq("is_deleted", false);

    const { data: images } = await supabase
      .from("asset_images")
      .select("storage_path")
      .eq("asset_id", assetId)
      .eq("is_deleted", false);

    // Delete files from storage
    if (files && files.length > 0) {
      const filePaths = files.map((f) => f.storage_path);
      await supabase.storage.from("assets").remove(filePaths);
    }

    // Delete images from storage
    if (images && images.length > 0) {
      const imagePaths = images.map((i) => i.storage_path);
      await supabase.storage.from("assets").remove(imagePaths);
    }

    // Soft delete all related records
    await supabase
      .from("asset_files")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("asset_id", assetId);

    await supabase
      .from("asset_images")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("asset_id", assetId);

    await supabase
      .from("asset_tags")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("asset_id", assetId);

    await supabase
      .from("asset_royalties")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("asset_id", assetId);

    await supabase
      .from("asset_licenses")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("asset_id", assetId);

    // Soft delete the asset itself
    const { error: deleteError } = await supabase
      .from("assets")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", assetId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/assets");

    return { success: true };
  } catch (error) {
    console.error("Delete asset error:", error);
    return { success: false, error: "Failed to delete asset" };
  }
}
