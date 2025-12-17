import type { APIRoute } from "astro";
import { getProductPriceBreakdown } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ params }) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const priceBreakdown = await getProductPriceBreakdown(productId);

    return new Response(JSON.stringify(priceBreakdown), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching price breakdown:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch price breakdown" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
