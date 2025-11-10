import type { APIRoute} from "astro";
import { getVariantRoyaltyTotal } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ params }) => {
  const variantId = params.variantId;

  if (!variantId) {
    return new Response(
      JSON.stringify({ error: "Variant ID is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const total = await getVariantRoyaltyTotal(variantId);

    return new Response(
      JSON.stringify({ total }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error calculating royalty total:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to calculate total",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
