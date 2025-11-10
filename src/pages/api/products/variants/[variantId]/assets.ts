import type { APIRoute } from "astro";
import { getVariantAssets } from "@/lib/data-access/products";

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
    const assets = await getVariantAssets(variantId);

    return new Response(
      JSON.stringify({ assets }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching variant assets:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch assets",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
