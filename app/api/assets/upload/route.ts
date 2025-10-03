import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET_MAP = {
  model: "models",
  illustration: "illustrations",
  texture: "textures",
  photo: "previews",
} as const;

const MAX_FILE_SIZES = {
  model: 500 * 1024 * 1024, // 500MB
  illustration: 100 * 1024 * 1024, // 100MB
  texture: 50 * 1024 * 1024, // 50MB
  photo: 10 * 1024 * 1024, // 10MB
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
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[assetType as keyof typeof MAX_FILE_SIZES];
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
        },
        { status: 400 }
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
        { status: 500 }
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
      { status: 500 }
    );
  }
}
