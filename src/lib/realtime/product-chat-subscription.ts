import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

export interface ProductChatMessage {
  id: string;
  product_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string | null;
    handle: string;
    avatar_url: string | null;
  };
}

/**
 * Subscribe to realtime chat messages for a product
 * This is a client-side only function for use in SolidJS islands
 */
export const subscribeToProductChat = async (
  productId: string,
  onMessage: (message: ProductChatMessage) => void
): Promise<() => void> => {
  try {
    const { createClient } = await import("@supabase/supabase-js");

    const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

    if (!url || !key) {
      console.warn("Supabase env vars not available for realtime");
      return () => {};
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

    return () => {
      realtimeClient.removeChannel(channel);
    };
  } catch (e) {
    console.warn("Failed to set up realtime subscription:", e);
    return () => {};
  }
};
