import { serverClient } from "./client";

export interface ProductChatMessage {
  id: string;
  product_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string | null;
    handle: string;
  };
}

/**
 * Get all chat messages for a product with user information
 */
export const getProductChatMessages = async (
  productId: string
): Promise<ProductChatMessage[]> => {
  const { data, error } = await serverClient
    .from("product_chat_messages")
    .select(`
      *,
      user:users!user_id (
        name,
        handle
      )
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }

  return (data as ProductChatMessage[]) || [];
};

/**
 * Create a new chat message
 */
export const createChatMessage = async (
  productId: string,
  userId: string,
  message: string
): Promise<ProductChatMessage | null> => {
  const { data, error } = await serverClient
    .from("product_chat_messages")
    .insert({
      product_id: productId,
      user_id: userId,
      message: message,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat message:", error);
    return null;
  }

  return data as ProductChatMessage;
};
