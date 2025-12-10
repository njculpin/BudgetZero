import type { APIRoute } from "astro";
import { getProductFiles } from "@/lib/data-access/products";

/**
 * GET /api/products/[productId]/files
 * Fetch all files for a product
 */
export const GET: APIRoute = async ({ params }) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const files = await getProductFiles(productId);

    return new Response(
      JSON.stringify({ files }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching product files:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch product files",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
