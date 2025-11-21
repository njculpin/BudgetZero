import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
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

/**
 * Subscribe to realtime chat messages for a product
 * Returns a cleanup function to unsubscribe
 *
 * Note: This creates a client-side Supabase client for realtime subscriptions.
 * This is necessary because realtime requires a persistent connection.
 */
export const subscribeToProductChat = async (
  productId: string,
  onMessage: (message: ProductChatMessage) => void
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
    .channel(`realtime:product_chat_messages:${productId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "product_chat_messages",
        filter: `product_id=eq.${productId}`,
      },
      (payload: RealtimePostgresInsertPayload<ProductChatMessage>) => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    realtimeClient.removeChannel(channel);
  };
};
