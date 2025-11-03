import type { APIRoute } from "astro";
import { serverClient } from "@/lib/data-access/client";

export const POST: APIRoute = async ({ request, cookies }) => {
  const { assetId, userId, message } = await request.json();

  const { error } = await serverClient
    .from("asset_chat_messages")
    .insert({ asset_id: assetId, user_id: userId, message });

  if (error) return new Response(JSON.stringify({ error }), { status: 400 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
