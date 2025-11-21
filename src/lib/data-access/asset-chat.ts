import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { serverClient } from "./client";

export interface AssetChatMessage {
  id: string;
  asset_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string | null;
    handle: string;
  };
}

/**
 * Get all chat messages for an asset with user information
 */
export const getAssetChatMessages = async (
  assetId: string
): Promise<AssetChatMessage[]> => {
  const { data, error } = await serverClient
    .from("asset_chat_messages")
    .select(`
      *,
      user:users!user_id (
        name,
        handle
      )
    `)
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }

  return (data as AssetChatMessage[]) || [];
};

/**
 * Create a new chat message
 */
export const createChatMessage = async (
  assetId: string,
  userId: string,
  message: string
): Promise<AssetChatMessage | null> => {
  const { data, error } = await serverClient
    .from("asset_chat_messages")
    .insert({
      asset_id: assetId,
      user_id: userId,
      message: message,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat message:", error);
    return null;
  }

  return data as AssetChatMessage;
};

/**
 * Subscribe to realtime chat messages for an asset
 * Returns a cleanup function to unsubscribe
 *
 * Note: This creates a client-side Supabase client for realtime subscriptions.
 * This is necessary because realtime requires a persistent connection.
 */
export const subscribeToAssetChat = async (
  assetId: string,
  onMessage: (message: AssetChatMessage) => void
): Promise<() => void> => {
  // Dynamic import for client-side only
  const { createClient } = await import("@supabase/supabase-js");
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  const realtimeClient = createClient(url, key);

  const channel = realtimeClient
    .channel(`realtime:asset_chat_messages:${assetId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "asset_chat_messages",
        filter: `asset_id=eq.${assetId}`,
      },
      (payload: RealtimePostgresInsertPayload<AssetChatMessage>) => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    realtimeClient.removeChannel(channel);
  };
};
