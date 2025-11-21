import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

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
 * Subscribe to realtime chat messages for an asset
 * This is a client-side only function for use in SolidJS islands
 */
export const subscribeToAssetChat = async (
  assetId: string,
  onMessage: (message: AssetChatMessage) => void
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

    return () => {
      realtimeClient.removeChannel(channel);
    };
  } catch (e) {
    console.warn("Failed to set up realtime subscription:", e);
    return () => {};
  }
};
