import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import {
  updateAsset,
  getAssetById,
  createAssetFile,
  createAssetImage,
  createAssetTag,
  getAssetTags,
  getAssetFiles,
  getAssetImages,
} from "@/lib/data-access/assets";
import { canChangeAssetStatus } from "@/lib/data-access/asset-validation";
import { serverClient } from "@/lib/data-access/client";
import { uploadFile, generateFilePath } from "@/lib/storage";
import type { AssetStatus } from "@/types";

const updateAssetSchema = z.object({
  assetId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "private", "public", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;
  const currentAccessToken = session.data.session?.access_token;

  if (!currentAccessToken) {
    return new Response(JSON.stringify({ error: "No valid access token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const assetId = formData.get("assetId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const tagsJson = formData.get("tags") as string;

    // Get all file and image uploads
    const files = formData.getAll("files") as File[];
    const images = formData.getAll("images") as File[];

    // Verify ownership
    const asset = await getAssetById(assetId);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate status downgrade (prevent breaking other users' products)
    if (status && status !== asset.status) {
      const validation = await canChangeAssetStatus(
        assetId,
        asset.status as AssetStatus,
        status as AssetStatus,
        userId
      );

      if (!validation.allowed) {
        return new Response(
          JSON.stringify({
            error: validation.reason,
            affectedProducts: validation.affectedProducts,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate publish requirements for private and public statuses
    if (status === "private" || status === "public") {
      const existingImages = await getAssetImages(assetId);
      const existingFiles = await getAssetFiles(assetId);

      if (existingImages.length === 0 && (!images || images.length === 0)) {
        return new Response(
          JSON.stringify({
            error: "Cannot publish asset without at least one image. Please upload an image first.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (existingFiles.length === 0 && (!files || files.length === 0)) {
        return new Response(
          JSON.stringify({
            error: "Cannot publish asset without at least one file. Please upload a file first.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update basic asset info - only include fields that are provided
    // todo: Typescript
    const updateData = {};
    if (title) {
      updateData.title = title;
    }
    if (description !== null && description !== undefined) {
      updateData.description = description;
    }
    if (status) {
      updateData.status = status;
    }

    const updatedAsset = await updateAsset(assetId, updateData);

    if (!updatedAsset) {
      return new Response(JSON.stringify({ error: "Failed to update asset" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle tags - delete all existing and create new ones
    if (tagsJson) {
      const tags = JSON.parse(tagsJson) as string[];

      // Delete all existing tags
      const existingTags = await getAssetTags(assetId);
      for (const existingTag of existingTags) {
        await serverClient
          .from('asset_tags')
          .delete()
          .eq('id', existingTag.id);
      }

      // Create new tags from the array
      for (const tag of tags) {
        await createAssetTag(assetId, tag);
      }
    }

    // Upload new asset files
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size > 0) {
          const filePath = generateFilePath(userId, file.name, assetId);
          const uploadResult = await uploadFile({
            bucket: "asset-files",
            path: filePath,
            file,
            accessToken: currentAccessToken,
          });

          if (uploadResult) {
            await createAssetFile(
              assetId,
              {
                title: file.name,
                description: `Uploaded file: ${file.name}`,
                file_url: uploadResult.url,
                storage_path: uploadResult.path,
                file_size_bytes: uploadResult.size,
                mime_type: file.type,
              }
            );
          }
        }
      }
    }

    // Upload new cover images
    if (images && images.length > 0) {
      for (const image of images) {
        if (image.size > 0) {
          const imagePath = generateFilePath(userId, image.name, assetId);
          const uploadResult = await uploadFile({
            bucket: "asset-images",
            path: imagePath,
            file: image,
            accessToken: currentAccessToken,
          });

          if (uploadResult) {
            await createAssetImage(
              assetId,
              {
                title: image.name,
                description: `Cover image: ${image.name}`,
                file_url: uploadResult.url,
                storage_path: uploadResult.path,
                file_size_bytes: uploadResult.size,
                mime_type: image.type,
              }
            );
          }
        }
      }
    }

    // Fetch updated files and images to return to client
    const updatedFiles = await getAssetFiles(assetId);
    const updatedImages = await getAssetImages(assetId);

    return new Response(
      JSON.stringify({
        success: true,
        asset: updatedAsset,
        files: updatedFiles,
        images: updatedImages,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update asset error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to update asset",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
