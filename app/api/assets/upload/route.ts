import { type NextRequest, NextResponse } from "next/server";
import {
  FILE_SIZE_LABELS,
  validateFile,
} from "@/lib/constants/file-sizes";
import { createClient } from "@/lib/supabase/server";
import type { AssetType } from "@/lib/types/database";

const BUCKET_MAP = {
  model: "models",
  illustration: "illustrations",
  texture: "textures",
  photo: "previews",
  audio: "audio",
} as const;

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
    const file = formData.get("file") as File;
    const assetType = formData.get("asset_type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!assetType || !BUCKET_MAP[assetType as keyof typeof BUCKET_MAP]) {
      return NextResponse.json(
        { error: "Invalid asset_type" },
        { status: 400 },
      );
    }

    // Comprehensive file validation (size, MIME type, extension)
    const validation = validateFile(file, assetType as AssetType);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const bucket = BUCKET_MAP[assetType as keyof typeof BUCKET_MAP];

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

    return NextResponse.json({
      file_url: publicUrl,
      file_path: uploadData.path,
      file_size_bytes: file.size,
      file_format: fileExt,
      bucket,
    });
  } catch (error) {
    console.error("Error in POST /api/assets/upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
