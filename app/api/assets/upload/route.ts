import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Determine asset type from file extension
// Focus on tabletop gaming assets (3D printable models, artwork, textures)
function getAssetType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();

  // 3D printable model files for tabletop gaming miniatures/terrain
  const modelExtensions = ["stl", "obj", "3mf", "ply", "amf", "glb", "gltf", "fbx", "usdz", "blend"];

  // Illustrations and artwork
  const illustrationExtensions = ["png", "jpg", "jpeg", "webp", "svg", "ai", "psd", "eps", "pdf"];

  // Audio for ambience/sound effects
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac"];

  // Texture maps for painting/rendering
  const textureExtensions = ["tga", "exr", "dds", "hdr"];

  // Compressed archives (often contain multiple STL files or project files)
  const archiveExtensions = ["zip", "rar", "7z", "tar", "gz"];

  if (modelExtensions.includes(ext || "")) return "model";
  if (illustrationExtensions.includes(ext || "")) return "illustration";
  if (audioExtensions.includes(ext || "")) return "audio";
  if (textureExtensions.includes(ext || "")) return "texture";
  if (archiveExtensions.includes(ext || "")) return "other"; // Archives stored as "other" type

  return "other";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const primaryFile = formData.get("primaryFile") as File;
    const previewFiles = formData.getAll("previewImages") as File[];
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const tagsJson = formData.get("tags") as string;
    const projectId = formData.get("project_id") as string | null;
    const teamId = formData.get("team_id") as string | null;

    if (!primaryFile || !title) {
      return NextResponse.json(
        { error: "Primary file and title are required" },
        { status: 400 },
      );
    }

    // Parse tags
    let tags: string[] = [];
    try {
      tags = JSON.parse(tagsJson || "[]");
    } catch (e) {
      return NextResponse.json({ error: "Invalid tags format" }, { status: 400 });
    }

    // Determine asset type from file
    const assetType = getAssetType(primaryFile.name);

    // Upload primary file to Supabase Storage
    const fileExt = primaryFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(fileName, primaryFile, {
        contentType: primaryFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("assets").getPublicUrl(fileName);

    // Create asset record (settings and stats are created automatically by trigger)
    const { data: asset, error: assetError} = await supabase
      .from("assets")
      .insert({
        creator_id: user.id,
        project_id: projectId,
        team_id: teamId,
        title,
        description,
        asset_type: assetType,
        thumbnail_url: null, // Deprecated - using asset_preview_images instead
        preview_url: publicUrl,
        status: "active",
      })
      .select()
      .single();

    if (assetError) {
      console.error("Asset creation error:", assetError);
      console.error("User ID:", user.id);
      console.error("Asset data:", { creator_id: user.id, project_id: projectId, team_id: teamId, title, assetType });
      return NextResponse.json(
        { error: `Failed to create asset: ${assetError.message}. Code: ${assetError.code}. Details: ${assetError.details}` },
        { status: 500 },
      );
    }

    // Create asset file record
    const { error: fileError } = await supabase.from("asset_files").insert({
      asset_id: asset.id,
      file_url: publicUrl,
      file_size_bytes: primaryFile.size,
      file_format: fileExt,
      file_name: primaryFile.name,
      display_order: 0,
    });

    if (fileError) {
      console.error("Asset file creation error:", fileError);
      // Non-fatal - asset is created
    }

    // Upload preview images if provided
    if (previewFiles.length > 0) {
      const previewImageRecords = [];

      for (let i = 0; i < previewFiles.length; i++) {
        const previewFile = previewFiles[i];
        const previewExt = previewFile.name.split(".").pop();
        const previewFileName = `${user.id}/previews/${asset.id}/${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${previewExt}`;

        const { error: previewUploadError } = await supabase.storage
          .from("assets")
          .upload(previewFileName, previewFile, {
            contentType: previewFile.type,
            upsert: false,
          });

        if (!previewUploadError) {
          const {
            data: { publicUrl: previewPublicUrl },
          } = supabase.storage.from("assets").getPublicUrl(previewFileName);

          previewImageRecords.push({
            asset_id: asset.id,
            file_url: previewPublicUrl,
            file_size_bytes: previewFile.size,
            file_format: previewExt,
            display_order: i,
          });
        } else {
          console.error(`Preview image ${i} upload error:`, previewUploadError);
        }
      }

      // Insert all preview images at once
      if (previewImageRecords.length > 0) {
        const { error: previewError } = await supabase
          .from("asset_preview_images")
          .insert(previewImageRecords);

        if (previewError) {
          console.error("Preview images creation error:", previewError);
          // Non-fatal - asset is created
        }
      }
    }

    // Add tags
    if (tags.length > 0) {
      const tagRecords = tags.map((tag) => ({
        asset_id: asset.id,
        tag: tag.toLowerCase().trim(),
      }));

      const { error: tagsError } = await supabase
        .from("asset_tags")
        .insert(tagRecords);

      if (tagsError) {
        console.error("Asset tags creation error:", tagsError);
      }
    }

    return NextResponse.json({
      asset,
      message: "Asset uploaded successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
