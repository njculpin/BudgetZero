import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { addDocumentToProduct, getProductById } from "@/lib/data-access/products";
import { z } from "zod";

const addDocumentSchema = z.object({
  productId: z.string().uuid(),
  documentId: z.string().uuid(),
  priceCents: z.number().int().min(0).default(0),
});

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

  try {
    const body = await request.json();
    const validatedData = addDocumentSchema.parse(body);

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

    // Add document to product
    const productDocument = await addDocumentToProduct(
      validatedData.productId,
      validatedData.documentId,
      validatedData.priceCents
    );

    if (!productDocument) {
      return new Response(
        JSON.stringify({ error: "Failed to add document to product" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, productDocument }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Add document error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to add document",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
