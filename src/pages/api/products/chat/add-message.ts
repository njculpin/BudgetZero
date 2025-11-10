import type { APIRoute } from "astro";
import { createChatMessage } from "@/lib/data-access/product-chat";

export const POST: APIRoute = async ({ request }) => {
  const { productId, userId, message } = await request.json();

  if (!productId || !userId || !message) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    );
  }

  const chatMessage = await createChatMessage(productId, userId, message);

  if (!chatMessage) {
    return new Response(
      JSON.stringify({ error: "Failed to create message" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
