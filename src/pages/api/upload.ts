import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import {
  checkRateLimit,
  rateLimitIdentity,
  rateLimitedResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import {
  uploadFile,
  generateFilePath,
  validateFile,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
} from "@/lib/storage";

/**
 * Buckets this generic endpoint may write to.
 *
 * `product-files` is deliberately excluded: paid product files must go through
 * `/api/products/upload-files`, which verifies the caller owns the product before
 * writing. Allowing them here would let any authenticated user seed the paid-file
 * bucket without an ownership check.
 */
const uploadSchema = z.object({
  bucket: z.enum([
    "product-images",
    "user-avatars",
    "document-attachments",
  ]),
  prefix: z.string().optional(),
});

type UploadableBucket = z.infer<typeof uploadSchema>["bucket"];

// Define allowed file types per bucket
const BUCKET_FILE_TYPES: Record<UploadableBucket, string[]> = {
  "product-images": IMAGE_TYPES,
  "user-avatars": IMAGE_TYPES,
  "document-attachments": DOCUMENT_TYPES,
};

// Define max file sizes per bucket (in MB)
const BUCKET_MAX_SIZES: Record<UploadableBucket, number> = {
  "product-images": 10,
  "user-avatars": 5,
  "document-attachments": 50,
};

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
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

  // Uploads are the most expensive authenticated action, so the quota is keyed to
  // the user rather than the address — it should follow the account across
  // networks, and the caller is already authenticated by this point.
  const rateLimit = await checkRateLimit(
    RATE_LIMITS.upload,
    rateLimitIdentity(request, clientAddress, userId)
  );

  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit);
  }

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
