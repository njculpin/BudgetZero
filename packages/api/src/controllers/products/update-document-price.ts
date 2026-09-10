import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { updateProductDocumentPrice } from "@gameloopers/core/data-access/products";
import { serverClient } from "@gameloopers/core/data-access/client";
import { z } from "zod";

const updatePriceSchema = z.object({
  productDocumentId: z.string().uuid(),
  priceCents: z.number().int().min(0),
});

export const productsUpdateDocumentPrice: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = updatePriceSchema.parse(body);

    // Verify ownership
    const { data: productDoc } = await serverClient
      .from("product_documents")
      .select("product_id, products!inner(user_id)")
      .eq("id", validatedData.productDocumentId)
      .single();

    if (!productDoc) {
      return new Response(JSON.stringify({ error: "Product document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productUserId = (productDoc.products as unknown as { user_id: string })?.user_id;
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
