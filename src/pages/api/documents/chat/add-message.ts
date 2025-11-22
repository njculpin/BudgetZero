import type { APIRoute } from "astro";
import { createDocumentChatMessage } from "@/lib/data-access/document-chat";

export const POST: APIRoute = async ({ request }) => {
  const { documentId, userId, message } = await request.json();

  if (!documentId || !userId || !message) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const chatMessage = await createDocumentChatMessage(documentId, userId, message);

  if (!chatMessage) {
    return new Response(
      JSON.stringify({ error: "Failed to create message" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
