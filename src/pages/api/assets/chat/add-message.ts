import type { APIRoute } from "astro";
import { createChatMessage } from "@/lib/data-access/asset-chat";

export const POST: APIRoute = async ({ request }) => {
  const { assetId, userId, message } = await request.json();

  if (!assetId || !userId || !message) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    );
  }

  const chatMessage = await createChatMessage(assetId, userId, message);

  if (!chatMessage) {
    return new Response(
      JSON.stringify({ error: "Failed to create message" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
