"use server";

import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/sdk/server/users";
import {
  createAsset,
  createAssetImage,
  createAssetFile,
  createAssetTag,
} from "@/lib/sdk/server/assets";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface UploadAssetResult {
  success: boolean;
  assetId?: string;
  error?: string;
}

export async function uploadAsset(
  formData: FormData,
): Promise<UploadAssetResult> {
  try {
    // Get authenticated user
    const user = await getMe();
    const supabase = await createClient();

    // Extract form data
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const tagsJson = formData.get("tags") as string;
    const tags = JSON.parse(tagsJson) as string[];
    const teamId = formData.get("team_id") as string | null;
    const primaryFile = formData.get("primaryFile") as File;
    const previewImages = formData.getAll("previewImages") as File[];

    // Validate required fields
    if (!title || !primaryFile) {
      return { success: false, error: "Title and file are required" };
    }

    // Create asset record
    const { data: asset, error: assetError } = await createAsset(supabase, {
      user_id: user.id,
      title,
      description,
      is_public: false, // Default to private
    });

    if (assetError || !asset) {
      return {
        success: false,
        error: assetError?.message || "Failed to create asset",
      };
    }

    // Upload primary file to storage
    const primaryFileName = `${user.id}/${asset.id}/${Date.now()}-${primaryFile.name}`;
    const { error: primaryFileError } = await supabase.storage
      .from("assets")
      .upload(primaryFileName, primaryFile);

    if (primaryFileError) {
      // Cleanup: delete asset if file upload fails
      await supabase.from("assets").delete().eq("id", asset.id);
      return {
        success: false,
        error: `Failed to upload file: ${primaryFileError.message}`,
      };
    }

    // Get public URL for primary file
    const {
      data: { publicUrl: primaryFileUrl },
    } = supabase.storage.from("assets").getPublicUrl(primaryFileName);

    // Create asset file record
    await createAssetFile(supabase, {
      asset_id: asset.id,
      file_url: primaryFileUrl,
      mime_type: primaryFile.type,
      caption: primaryFile.name, // Store filename in caption
    });

    // Upload preview images
    for (let i = 0; i < previewImages.length; i++) {
      const image = previewImages[i];
      const imageFileName = `${user.id}/${asset.id}/images/${Date.now()}-${image.name}`;

      const { error: imageUploadError } = await supabase.storage
        .from("assets")
        .upload(imageFileName, image);

      if (!imageUploadError) {
        const {
          data: { publicUrl: imageUrl },
        } = supabase.storage.from("assets").getPublicUrl(imageFileName);

        await createAssetImage(supabase, {
          asset_id: asset.id,
          image_url: imageUrl,
          position: i,
        });
      }
    }

    // Create tags
    for (const tag of tags) {
      await createAssetTag(supabase, {
        asset_id: asset.id,
        namespace: "user",
        value: tag,
      });
    }

    // Revalidate pages
    revalidatePath("/assets");
    revalidatePath(`/assets/${asset.id}`);

    return { success: true, assetId: asset.id };
  } catch (error) {
    console.error("Upload asset error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
