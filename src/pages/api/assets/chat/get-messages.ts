import type { APIRoute } from "astro";
import { getAssetChatMessages } from "@/lib/data-access/asset-chat";

export const GET: APIRoute = async ({ url }) => {
  const assetId = url.searchParams.get("assetId");

  if (!assetId) {
    return new Response(
      JSON.stringify({ error: "Missing assetId parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const messages = await getAssetChatMessages(assetId);
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching asset chat messages:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
