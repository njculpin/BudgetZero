import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import {
  uploadFile,
  generateFilePath,
  validateFile,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
  ASSET_FILE_TYPES,
} from "@/lib/storage";
import type { StorageBucket } from "@/lib/storage";

const uploadSchema = z.object({
  bucket: z.enum([
    "asset-files",
    "asset-images",
    "product-images",
    "user-avatars",
    "documents",
  ]),
  prefix: z.string().optional(),
});

// Define allowed file types per bucket
const BUCKET_FILE_TYPES: Record<StorageBucket, string[]> = {
  "asset-files": ASSET_FILE_TYPES,
  "asset-images": IMAGE_TYPES,
  "product-images": IMAGE_TYPES,
  "user-avatars": IMAGE_TYPES,
  documents: DOCUMENT_TYPES,
};

// Define max file sizes per bucket (in MB)
const BUCKET_MAX_SIZES: Record<StorageBucket, number> = {
  "asset-files": 100,
  "asset-images": 10,
  "product-images": 10,
  "user-avatars": 5,
  documents: 50,
};

export const POST: APIRoute = async ({ request, cookies }) => {
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
    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const prefix = formData.get("prefix") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate bucket and prefix
    const validatedData = uploadSchema.parse({
      bucket,
      prefix: prefix || undefined,
    });

    // Validate file type and size
    const allowedTypes = BUCKET_FILE_TYPES[validatedData.bucket];
    const maxSizeMB = BUCKET_MAX_SIZES[validatedData.bucket];

    const validationError = validateFile(file, allowedTypes, maxSizeMB);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate file path
    const filePath = generateFilePath(
      userId,
      file.name,
      validatedData.prefix
    );

    // Upload file
    const result = await uploadFile({
      bucket: validatedData.bucket,
      path: filePath,
      file,
    });

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Failed to upload file" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        file: {
          path: result.path,
          url: result.url,
          size: result.size,
          type: result.type,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid upload data",
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
        error: error instanceof Error ? error.message : "Upload failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
