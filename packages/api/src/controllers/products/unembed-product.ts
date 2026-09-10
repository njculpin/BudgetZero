import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { serverClient } from "@gameloopers/core/data-access/client";
import { z } from "zod";

const unembedSchema = z.object({
  componentId: z.string().uuid(),
});

export const productsUnembedProduct: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = unembedSchema.parse(body);

    // Fetch the component to verify ownership
    const { data: component, error: componentError } = await serverClient
      .from("product_components")
      .select(`
        id,
        parent_product_id,
        products!parent_product_id (
          user_id
        )
      `)
      .eq("id", validatedData.componentId)
      .eq("deleted", false)
      .single();

    if (componentError || !component) {
      return new Response(JSON.stringify({ error: "Component not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // to-one embed: an object at runtime, array in the generated type.
    const parentProduct = component.products as unknown as { user_id: string };
    if (parentProduct.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Soft delete the component
    const { error: deleteError } = await serverClient
      .from("product_components")
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", validatedData.componentId);

    if (deleteError) {
      console.error("Error deleting product component:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to remove embedded product" }),
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
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unembed product error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to remove embedded product",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
