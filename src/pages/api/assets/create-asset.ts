import type { APIRoute } from "astro";
import { createAsset, createAssetFile, createAssetImage, createAssetTag } from "@/lib/data-access/assets";
import { uploadAssetFile, uploadAssetImage } from "@/lib/storage";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
      // Check authentication
  const { data: userData } = await getUser();
  const currentUser = userData?.user;

  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get auth tokens from cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response("Unauthorized", { status: 401 });
  }
try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as "draft" | "published";
    const files = formData.getAll("files") as File[];
    const images = formData.getAll("images") as File[];
    const tagsString = formData.get("tags") as string;

    if (!title) {
      return new Response("Title Required", { status: 401 });
    } else {
      // Create the asset
      const asset = await createAsset(
        currentUser.id,
        {
          title,
          description,
          status: status || "draft",
        },
        {
          accessToken: accessToken,
          refreshToken: refreshToken,
        }
      );

      if (!asset) {
        return new Response("Failed to create Asset", { status: 401 });
      } else {
        // Create tags if provided
        if (tagsString) {
          const tags = JSON.parse(tagsString) as string[];
          for (const tag of tags) {
            await createAssetTag(
              asset.id,
              tag,
              {
                accessToken: accessToken,
                refreshToken: refreshToken,
              }
            );
          }
        }

        // Upload files if provided
        if (files && files.length > 0) {
          for (const file of files) {
            if (file.size > 0) {
              const fileUpload = await uploadAssetFile(file, currentUser.id, asset.id);
              if (fileUpload) {
                await createAssetFile(
                  asset.id,
                  {
                    title: file.name,
                    description: `Uploaded file: ${file.name}`,
                    file_url: fileUpload.url,
                    storage_path: fileUpload.path,
                    file_size_bytes: fileUpload.size,
                    mime_type: file.type,
                  },
                  {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                  }
                );
              }
            }
          }
        }

        // Upload images if provided
        if (images && images.length > 0) {
          for (const image of images) {
            if (image.size > 0) {
              const imageUpload = await uploadAssetImage(image, currentUser.id, asset.id);
              if (imageUpload) {
                await createAssetImage(
                  asset.id,
                  {
                    title: image.name,
                    description: `Cover image: ${image.name}`,
                    file_url: imageUpload.url,
                    storage_path: imageUpload.path,
                    file_size_bytes: imageUpload.size,
                    mime_type: image.type,
                  },
                  {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                  }
                );
              }
            }
          }
        }

        // Redirect to the asset detail page
        return redirect(`/assets/${asset.handle}`);
      }
    }
  } catch (error) {
    console.error("Error creating asset:", error);
    return new Response("Failed to create Asset", { status: 401 }); 
  }
}