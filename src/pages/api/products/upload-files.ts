import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getProductById, createProductFile } from "@/lib/data-access/products";
import { uploadFile, generateFilePath } from "@/lib/storage";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Please sign in to upload files" }), {
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
      return new Response(JSON.stringify({ error: "Your session has expired. Please sign in again." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Your session has expired. Please sign in again." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;

  try {
    const formData = await request.formData();
    const productId = formData.get("productId") as string;
    const files = formData.getAll("files") as File[];

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
    for (const file of files) {
      // Generate file path
      const filePath = generateFilePath(
        userId,
        file.name,
        `products/${productId}/files`
      );

      // Upload to storage
      const uploadResult = await uploadFile({
        bucket: "asset-files",
        path: filePath,
        file,
        accessToken: accessToken.value,
      });

      if (!uploadResult) {
        console.error("File upload failed for:", file.name);
        continue; // Skip this file but continue with others
      }

      // Create database record
      const productFile = await createProductFile(productId, {
        title: file.name,
        description: "",
        file_url: uploadResult.url,
        storage_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
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
