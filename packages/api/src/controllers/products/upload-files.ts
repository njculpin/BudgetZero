import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getProductById, createProductFile } from "@gameloopers/core/data-access/products";
import { uploadFile, generateFilePath } from "@gameloopers/core/storage";
import {
  checkRateLimit,
  rateLimitIdentity,
  rateLimitedResponse,
  RATE_LIMITS,
} from "@gameloopers/core/rate-limit";

export const productsUploadFiles: Controller = async ({ request, userId, clientAddress, accessToken }) => {
  if (!userId) return unauthorized('Not authenticated');

  // Uploads are the most expensive authenticated action, so the quota is keyed to
  // the user rather than the address — it should follow the account across
  // networks, and the caller is already authenticated by this point.
  const rateLimit = await checkRateLimit(
    RATE_LIMITS.upload,
    rateLimitIdentity(request, clientAddress ?? undefined, userId)
  );

  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit);
  }

  try {
    const formData = await request.formData();
    const productId = formData.get("productId") as string;
    const files = formData.getAll("files") as File[];
    const prices = formData.getAll("prices") as string[];
    const titles = formData.getAll("titles") as string[];

    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "Please select at least one file to upload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check product ownership
    const product = await getProductById(productId);
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found. It may have been deleted." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (product.user_id !== userId) {
      return new Response(JSON.stringify({ error: "You don't have permission to upload files to this product" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Upload each file
    const uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const priceCents = prices[i] ? parseInt(prices[i], 10) : 0;
      const title = titles[i] || file.name;

      // Generate file path
      const filePath = generateFilePath(
        userId,
        file.name,
        `products/${productId}/files`
      );

      // Upload to storage
      const uploadResult = await uploadFile({
        bucket: "product-files",
        path: filePath,
        file,
        accessToken: accessToken ?? undefined,
      });

      if (!uploadResult) {
        console.error("File upload failed for:", file.name);
        continue; // Skip this file but continue with others
      }

      // Create database record with price
      const productFile = await createProductFile(productId, {
        title,
        description: "",
        file_url: uploadResult.url,
        storage_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
        price_cents: priceCents,
      });

      if (productFile) {
        uploadedFiles.push(productFile);
      }
    }

    if (uploadedFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Unable to upload files. Please check your file types and sizes, then try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        files: uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload files error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to upload files",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
