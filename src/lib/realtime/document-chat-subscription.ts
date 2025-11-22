import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

export interface DocumentChatMessage {
  id: string;
  document_id: string;
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
 * Subscribe to realtime chat messages for a document
 * This is a client-side only function for use in SolidJS islands
 */
export const subscribeToDocumentChat = async (
  documentId: string,
  onMessage: (message: DocumentChatMessage) => void
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
      .channel(`realtime:document_chat_messages:${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "document_chat_messages",
          filter: `document_id=eq.${documentId}`,
        },
        (payload: RealtimePostgresInsertPayload<DocumentChatMessage>) => {
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
