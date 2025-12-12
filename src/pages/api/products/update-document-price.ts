import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { updateProductDocumentPrice } from "@/lib/data-access/products";
import { serverClient } from "@/lib/data-access/client";
import { z } from "zod";

const updatePriceSchema = z.object({
  productDocumentId: z.string().uuid(),
  priceCents: z.number().int().min(0),
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
    const validatedData = updatePriceSchema.parse(body);

    // Verify ownership
    const { data: productDoc } = await serverClient
      .from("product_documents")
      .select("product_id, products(user_id)")
      .eq("id", validatedData.productDocumentId)
      .single();

    if (!productDoc) {
      return new Response(JSON.stringify({ error: "Product document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productUserId = (productDoc.products as { user_id: string })?.user_id;
    if (productUserId !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update price
    const success = await updateProductDocumentPrice(
      validatedData.productDocumentId,
      validatedData.priceCents
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to update document price" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update document price error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update price",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
