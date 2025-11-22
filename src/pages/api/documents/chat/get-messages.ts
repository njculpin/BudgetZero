import type { APIRoute } from "astro";
import { getDocumentChatMessages } from "@/lib/data-access/document-chat";

export const GET: APIRoute = async ({ url }) => {
  const documentId = url.searchParams.get("documentId");

  if (!documentId) {
    return new Response(
      JSON.stringify({ error: "Missing documentId parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const messages = await getDocumentChatMessages(documentId);
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching document chat messages:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
