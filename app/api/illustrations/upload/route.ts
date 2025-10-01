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
    const primaryFile = formData.get("primaryFile") as File | null;
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    if (!primaryFile) {
      return NextResponse.json(
        { error: "Illustration file is required" },
        { status: 400 }
      );
    }

    // Extract metadata
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const license_type = formData.get("license_type") as
      | "free"
      | "attribution"
      | "commercial"
      | "exclusive";
    const price_cents = parseInt(formData.get("price_cents") as string) || 0;
    const is_public =
      formData.get("is_public") === "true" ||
      formData.get("is_public") === "1";
    const seeking_collaborators =
      formData.get("seeking_collaborators") === "true" ||
      formData.get("seeking_collaborators") === "1";

    // Parse arrays
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];

    // Initialize services
    const storageService = new StorageService(supabase);
    const assetService = new AssetService(supabase);

    // Upload illustration file
    const illustrationUploadResult = await storageService.uploadIllustration(
      user.id,
      primaryFile,
      { isPublic: is_public }
    );

    if (illustrationUploadResult.error || !illustrationUploadResult.data) {
      return NextResponse.json(
        {
          error:
            illustrationUploadResult.error || "Failed to upload illustration",
        },
        { status: 500 }
      );
    }

    // Prepare asset data
    const assetData: Omit<CreateAssetData, "creator_id"> = {
      title,
      description: description || undefined,
      asset_type: "illustration",
      file_url: illustrationUploadResult.data.url,
      file_size_bytes: illustrationUploadResult.data.size,
      file_format: primaryFile.name.split(".").pop() || undefined,
      tags,
      license_type,
      price_cents,
      is_public,
      seeking_collaborators,
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

    return NextResponse.json({
      success: true,
      id: assetId,
      message: "Illustration uploaded successfully",
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
