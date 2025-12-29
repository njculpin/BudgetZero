import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import {
  updateProduct,
  getProductById,
  createProductImage,
  getProductFiles,
  getProductComponents,
  getProductDocuments,
  getProductImages,
} from "@/lib/data-access/products";
import { uploadFile, generateFilePath } from "@/lib/storage";
import { z } from "zod";

const updateProductSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "private", "public", "archived"]).optional(),
  handle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isEmbeddable: z.boolean().optional(),
  embeddingRoyaltyCents: z.number().min(0).optional(),
});

/**
 * Check if a product can be published
 * Validates that product meets publishing requirements
 */
async function validatePublishStatus(
  productId: string
): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
  // Get all data in parallel
  const [files, components, documents, images, product] = await Promise.all([
    getProductFiles(productId),
    getProductComponents(productId),
    getProductDocuments(productId),
    getProductImages(productId),
    getProductById(productId),
  ]);

  const errors: string[] = [];
  const warnings: string[] = [];

  // REQUIREMENT 1: At least one file OR embedded component
  if (files.length === 0 && components.length === 0) {
    errors.push("Add at least one file or embed a product before publishing");
  }

  // REQUIREMENT 2: Product images (warning only)
  if (!images || images.length === 0) {
    warnings.push("Product should have at least one image");
  }

  // REQUIREMENT 3: Description minimum length (warning only)
  if (!product?.description || product.description.trim().length < 20) {
    warnings.push("Add a detailed description (at least 20 characters)");
  }

  // REQUIREMENT 4: Embedded products must be private or public (not draft/archived)
  if (components.length > 0) {
    const childProducts = await Promise.all(
      components.map((c) => getProductById(c.child_product_id))
    );

    for (const child of childProducts) {
      if (child && child.status !== "public" && child.status !== "private") {
        errors.push(
          `Embedded product "${child.title}" must be private or published (not draft or archived)`
        );
      }
    }
  }

  // Return validation result
  if (errors.length > 0) {
    return {
      valid: false,
      error: errors[0], // Return first error
      warnings,
    };
  }

  return { valid: true, warnings };
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
      isEmbeddable: validatedData.isEmbeddable,
      embeddingRoyaltyCents: validatedData.embeddingRoyaltyCents,
    });

    if (!updatedProduct) {
      return new Response(
        JSON.stringify({ error: "Failed to update product" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Trigger PDF generation when product is published
    if (validatedData.status === 'public' && product.status !== 'public') {
      // Status changed to public - generate PDFs for all documents
      try {
        const pdfFormData = new FormData();
        pdfFormData.append("productId", validatedData.productId);

        await fetch(new URL("/api/products/generate-document-pdfs", request.url), {
          method: "POST",
          headers: {
            Cookie: request.headers.get("Cookie") || "",
          },
          body: pdfFormData,
        });
        // Note: PDF generation happens asynchronously, don't wait for it
      } catch (error) {
        console.error("Failed to trigger PDF generation:", error);
        // Don't fail the product update if PDF generation fails
      }
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
    const isEmbeddableString = formData.get("isEmbeddable") as string;
    const embeddingRoyaltyCentsString = formData.get("embeddingRoyaltyCents") as string;

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
      isEmbeddable?: boolean;
      embeddingRoyaltyCents?: number;
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
    if (isEmbeddableString !== null && isEmbeddableString !== undefined) {
      updateData.isEmbeddable = isEmbeddableString === 'true';
    }
    if (embeddingRoyaltyCentsString !== null && embeddingRoyaltyCentsString !== undefined) {
      updateData.embeddingRoyaltyCents = parseInt(embeddingRoyaltyCentsString, 10);
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
