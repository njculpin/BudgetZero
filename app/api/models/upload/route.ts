import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StorageService } from "@/lib/services/storage";
import { AssetService } from "@/lib/services/assets";
import { CreateAssetData } from "@/lib/types/database";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large file uploads

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Extract files
    const modelFile = formData.get("modelFile") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const textureFiles: File[] = [];

    // Collect all texture files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("texture_") && value instanceof File) {
        textureFiles.push(value);
      }
    }

    if (!modelFile) {
      return NextResponse.json(
        { error: "Model file is required" },
        { status: 400 }
      );
    }

    // Extract metadata
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const model_category = formData.get("model_category") as string;
    const license_type = formData.get("license_type") as
      | "free"
      | "attribution"
      | "commercial"
      | "exclusive";
    const price_cents = parseInt(formData.get("price_cents") as string) || 0;
    const is_public =
      formData.get("is_public") === "true" ||
      formData.get("is_public") === "1";

    // Parse arrays
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];
    const render_engine_tags = formData.get("render_engine_tags")
      ? JSON.parse(formData.get("render_engine_tags") as string)
      : [];

    // Parse optional model properties
    const polygon_count = formData.get("polygon_count")
      ? parseInt(formData.get("polygon_count") as string)
      : undefined;
    const vertex_count = formData.get("vertex_count")
      ? parseInt(formData.get("vertex_count") as string)
      : undefined;
    const is_rigged =
      formData.get("is_rigged") === "true" ||
      formData.get("is_rigged") === "1";
    const is_animated =
      formData.get("is_animated") === "true" ||
      formData.get("is_animated") === "1";
    const is_textured =
      formData.get("is_textured") === "true" ||
      formData.get("is_textured") === "1";
    const is_game_ready =
      formData.get("is_game_ready") === "true" ||
      formData.get("is_game_ready") === "1";
    const scale_unit = formData.get("scale_unit") as
      | "mm"
      | "cm"
      | "m"
      | "inch"
      | undefined;

    // Initialize services
    const storageService = new StorageService(supabase);
    const assetService = new AssetService(supabase);

    // Upload model file
    const modelUploadResult = await storageService.uploadModelFile(
      user.id,
      modelFile,
      { isPublic: is_public }
    );

    if (modelUploadResult.error || !modelUploadResult.data) {
      return NextResponse.json(
        { error: modelUploadResult.error || "Failed to upload model" },
        { status: 500 }
      );
    }

    // Prepare asset data
    const assetData: Omit<CreateAssetData, "creator_id"> = {
      title,
      description: description || undefined,
      asset_type: "model",
      file_url: modelUploadResult.data.url,
      file_size_bytes: modelUploadResult.data.size,
      file_format: modelFile.name.split(".").pop() || undefined,
      tags,
      license_type,
      price_cents,
      is_public,
      model_category,
      polygon_count,
      vertex_count,
      is_rigged,
      is_animated,
      is_textured,
      is_game_ready,
      scale_unit,
      render_engine_tags,
    };

    // Upload thumbnail if provided
    let thumbnailUrl: string | undefined;
    if (thumbnailFile) {
      // Create a temporary asset ID for thumbnail upload
      const tempAssetId = crypto.randomUUID();
      const thumbnailResult = await storageService.uploadThumbnail(
        user.id,
        thumbnailFile,
        tempAssetId
      );
      if (thumbnailResult.data) {
        thumbnailUrl = thumbnailResult.data.url;
      }
    }

    if (thumbnailUrl) {
      assetData.thumbnail_url = thumbnailUrl;
    }

    // Create asset record
    const createResult = await assetService.createAsset(user.id, assetData);

    if (createResult.error || !createResult.data) {
      return NextResponse.json(
        { error: createResult.error || "Failed to create asset" },
        { status: 500 }
      );
    }

    const assetId = createResult.data.id;

    // Upload texture files if any
    if (textureFiles.length > 0) {
      const textureUploads = textureFiles.map((file, index) =>
        storageService.uploadTexture(user.id, file, assetId, index)
      );

      await Promise.all(textureUploads);
      // Note: Texture file records would be inserted into asset_files table
      // This can be enhanced later to track individual texture files
    }

    return NextResponse.json({
      success: true,
      assetId,
      message: "Model uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}