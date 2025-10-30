import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { updateProduct, getProductById } from "@/lib/data-access/products";
import { z } from "zod";

const updateProductSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  handle: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const PUT: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = session.data.user.id;

  try {
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check product ownership
    const product = await getProductById(validatedData.productId);
    if (!product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (product.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = await updateProduct(
      validatedData.productId,
      {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        handle: validatedData.handle,
        tags: validatedData.tags,
      },
      {
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
      }
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to update product" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedProduct = await getProductById(validatedData.productId);

    return new Response(
      JSON.stringify({ product: updatedProduct }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
        error: error instanceof Error ? error.message : "Failed to update product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
