import type { APIRoute } from "astro";
import { getProductDocuments } from "@/lib/data-access/products";

export const GET: APIRoute = async ({ params }) => {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ error: "Product ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const documents = await getProductDocuments(productId);

    // Map to simpler format for price breakdown
    const documentPricing = documents.map(doc => ({
      id: doc.id,
      title: doc.document.title,
      price_cents: doc.price_cents,
    }));

    return new Response(JSON.stringify({ documents: documentPricing }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product documents:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch product documents" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
