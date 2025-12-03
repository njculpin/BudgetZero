import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { updateProduct, getProductById, getProductVariants, getVariantAssets, createProductImage } from "@/lib/data-access/products";
import { uploadFile, generateFilePath } from "@/lib/storage";
import { z } from "zod";

const updateProductSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "public", "archived"]).optional(),
  handle: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Check if a product can be public by verifying all linked assets are public
 */
async function validatePublishStatus(productId: string): Promise<{ valid: boolean; error?: string }> {
  const variants = await getProductVariants(productId);

  for (const variant of variants) {
    const assets = await getVariantAssets(variant.id);

    for (const asset of assets) {
      if (asset.status !== 'public') {
        return {
          valid: false,
          error: `Cannot publish product: Asset "${asset.title}" in variant "${variant.title}" must be public first`
        };
      }
    }
  }

  return { valid: true };
}

export const PUT: APIRoute = async ({ request, cookies }) => {
  // Check authentication
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
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check product ownership
    const product = await getProductById(validatedData.productId);
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (product.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate publish status if trying to publish
    if (validatedData.status === 'public') {
      const validation = await validatePublishStatus(validatedData.productId);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const updatedProduct = await updateProduct(validatedData.productId, {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      handle: validatedData.handle,
      tags: validatedData.tags,
    });

    if (!updatedProduct) {
      return new Response(
        JSON.stringify({ error: "Failed to update product" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ product: updatedProduct }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Update product error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to update product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST handler for FormData with file uploads
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
    const productId = formData.get("productId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const tagsJson = formData.get("tags") as string;

    // Handle both single cover image and multiple images
    const coverImageFile = formData.get("coverImage") as File | null;
    const imageFiles = formData.getAll("images") as File[];

    // Verify ownership
    const product = await getProductById(productId);
    if (!product || product.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle multiple image uploads if provided
    if (imageFiles && imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        if (imageFile && imageFile.size > 0) {
          const filePath = generateFilePath(userId, imageFile.name, productId);
          const uploadResult = await uploadFile({
            bucket: "product-images",
            path: filePath,
            file: imageFile,
            accessToken: currentAccessToken,
          });

          if (uploadResult) {
            await createProductImage(productId, {
              title: imageFile.name,
              description: `Product image: ${imageFile.name}`,
              file_url: uploadResult.url,
              storage_path: uploadResult.path,
              file_size_bytes: uploadResult.size,
              mime_type: imageFile.type,
            });
          }
        }
      }
    }
    // Fallback to single cover image upload for backward compatibility
    else if (coverImageFile && coverImageFile.size > 0) {
      const filePath = generateFilePath(userId, coverImageFile.name, productId);
      const uploadResult = await uploadFile({
        bucket: "product-images",
        path: filePath,
        file: coverImageFile,
        accessToken: currentAccessToken,
      });

      if (uploadResult) {
        await createProductImage(productId, {
          title: coverImageFile.name,
          description: `Cover image: ${coverImageFile.name}`,
          file_url: uploadResult.url,
          storage_path: uploadResult.path,
          file_size_bytes: uploadResult.size,
          mime_type: coverImageFile.type,
        });
      }
    }

    // Validate publish status if trying to publish
    if (status === 'public') {
      const validation = await validatePublishStatus(productId);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Build update data object - only include fields that are provided
    const updateData: {
      title?: string;
      description?: string;
      status?: "draft" | "private" | "public" | "archived";
      tags?: string[];
    } = {};

    if (title) {
      updateData.title = title;
    }
    if (description !== null && description !== undefined) {
      updateData.description = description;
    }
    if (status) {
      updateData.status = status as "draft" | "public" | "archived";
    }
    if (tagsJson) {
      updateData.tags = JSON.parse(tagsJson);
    }

    const updatedProduct = await updateProduct(productId, updateData);

    if (!updatedProduct) {
      return new Response(
        JSON.stringify({ error: "Failed to update product" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: updatedProduct,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update product error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Update failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
