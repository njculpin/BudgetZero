import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { createProduct, createProductTag } from "@/lib/data-access/products";
import { z } from "zod";

/**
 * Generate a unique default product title with timestamp
 */
const generateDefaultTitle = (): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `New Product - ${dateStr} ${timeStr}`;
};

const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "public", "archived"]).default("draft"),
  tags: z.array(z.string()).optional(),
});

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
    // Handle both FormData and JSON
    let data: Record<string, unknown>;
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await request.json();
    } else {
      // Handle FormData (from HTML form submission)
      const formData = await request.formData();
      data = {
        title: formData.get("title") || generateDefaultTitle(),
        description: formData.get("description") || undefined,
        status: formData.get("status") || "draft",
      };

      // Handle tags if provided
      const tagsString = formData.get("tags");
      if (tagsString && typeof tagsString === "string") {
        data.tags = tagsString
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    // Apply default title for JSON requests without a title
    if (!data.title) {
      data.title = generateDefaultTitle();
    }

    const validatedData = createProductSchema.parse(data);

    const product = await createProduct(userId, {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status || "draft",
    });

    if (!product) {
      return new Response(
        JSON.stringify({ error: "Failed to create product" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create tags if provided
    if (validatedData.tags && validatedData.tags.length > 0) {
      for (const tag of validatedData.tags) {
        await createProductTag(product.id, tag);
      }
    }

    // Redirect to edit page for form submissions, return JSON for API calls
    if (contentType?.includes("application/json")) {
      return new Response(JSON.stringify({ product }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(null, {
        status: 303,
        headers: {
          Location: `/products/${product.handle}/edit`,
        },
      });
    }
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to create product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
