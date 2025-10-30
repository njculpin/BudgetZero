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
} from "@/lib/data-access/assets";
import { uploadFile, generateFilePath } from "@/lib/storage";

const updateAssetSchema = z.object({
  assetId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
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

    // Prepare auth tokens
    const authTokens = {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    };

    // Verify ownership (pass auth tokens to see own drafts)
    const asset = await getAssetById(assetId, authTokens);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update basic asset info
    const updatedAsset = await updateAsset(
      assetId,
      {
        title,
        description: description || undefined,
        status: status as "draft" | "published" | "archived" | undefined,
      },
      authTokens
    );

    if (!updatedAsset) {
      return new Response(
        JSON.stringify({ error: "Failed to update asset" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle tags - delete existing and create new ones
    if (tagsJson) {
      const tags = JSON.parse(tagsJson) as string[];
      const existingTags = await getAssetTags(assetId);

      // For now, just add new tags (we can add delete functionality later)
      for (const tag of tags) {
        if (!existingTags.find(t => t.value === tag)) {
          await createAssetTag(assetId, tag, authTokens);
        }
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
              },
              authTokens
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
              },
              authTokens
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        asset: updatedAsset,
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
        error: error instanceof Error ? error.message : "Failed to update asset",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
