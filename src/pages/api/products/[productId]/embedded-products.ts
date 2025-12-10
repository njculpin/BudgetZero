import type { APIRoute } from "astro";
import { serverClient } from "@/lib/data-access/client";

export const GET: APIRoute = async ({ params }) => {
  const productId = params.productId;

  if (!productId) {
    return new Response(
      JSON.stringify({ error: "Product ID is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Fetch embedded products (product_components)
    const { data: components, error: componentsError } = await serverClient
      .from("product_components")
      .select(`
        id,
        child_product_id,
        inherited_price_cents,
        products!child_product_id (
          id,
          title,
          handle,
          status,
          user_id,
          users (
            name,
            handle
          )
        )
      `)
      .eq("parent_product_id", productId)
      .eq("deleted", false);

    if (componentsError) {
      console.error("Error fetching embedded products:", componentsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch embedded products" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!components || components.length === 0) {
      return new Response(
        JSON.stringify({ embeddedProducts: [] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get file counts for embedded products
    const productIds = components.map((c) => c.child_product_id);
    const { data: fileCounts } = await serverClient
      .from("product_files")
      .select("product_id")
      .in("product_id", productIds)
      .eq("deleted", false);

    const fileCountMap: Record<string, number> = {};
    if (fileCounts) {
      fileCounts.forEach((fc) => {
        fileCountMap[fc.product_id] = (fileCountMap[fc.product_id] || 0) + 1;
      });
    }

    // Format response
    const embeddedProducts = components.map((component) => {
      const product = component.products as any;
      const creator = product.users as any;

      return {
        id: product.id,
        component_id: component.id,
        title: product.title,
        handle: product.handle,
        status: product.status,
        inherited_price_cents: component.inherited_price_cents,
        creator_name: creator?.name || "Unknown",
        creator_handle: creator?.handle || "unknown",
        file_count: fileCountMap[product.id] || 0,
      };
    });

    return new Response(
      JSON.stringify({ embeddedProducts }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching embedded products:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch embedded products",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
