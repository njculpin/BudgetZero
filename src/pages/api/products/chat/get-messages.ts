import type { APIRoute } from "astro";
import { getProductChatMessages } from "@/lib/data-access/product-chat";

export const GET: APIRoute = async ({ url }) => {
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return new Response(
      JSON.stringify({ error: "Missing productId parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const messages = await getProductChatMessages(productId);
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching product chat messages:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
