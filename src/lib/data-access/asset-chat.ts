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
