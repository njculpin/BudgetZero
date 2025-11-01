import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { createProduct, createProductTag } from "@/lib/data-access/products";
import { z } from "zod";

const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
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
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    const product = await createProduct(userId, {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
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

    return new Response(JSON.stringify({ product }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Create product error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to create product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
