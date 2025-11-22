/**
 * Realtime subscription for document content collaboration
 * Uses Supabase Realtime Broadcast for real-time sync between editors
 */

interface DocumentContentPayload {
  type: "content_update";
  content: Record<string, unknown>;
  userId: string;
  timestamp: number;
}

interface PresencePayload {
  userId: string;
  userName: string | null;
  userHandle: string | null;
  cursorPosition?: { from: number; to: number } | null;
}

interface DocumentRealtimeCallbacks {
  onContentUpdate: (content: Record<string, unknown>, senderId: string) => void;
  onPresenceUpdate: (presence: Map<string, PresencePayload>) => void;
}

interface DocumentRealtimeReturn {
  broadcastContent: (content: Record<string, unknown>, userId: string) => void;
  updatePresence: (presence: PresencePayload) => void;
  unsubscribe: () => void;
}

/**
 * Subscribe to realtime document collaboration
 * Handles content syncing and presence tracking
 */
export const subscribeToDocumentContent = async (
  documentId: string,
  userId: string,
  callbacks: DocumentRealtimeCallbacks
): Promise<DocumentRealtimeReturn> => {
  try {
    const { createClient } = await import("@supabase/supabase-js");

    const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

    if (!url || !key) {
      console.warn("Supabase env vars not available for realtime");
      return {
        broadcastContent: () => {},
        updatePresence: () => {},
        unsubscribe: () => {},
      };
    }

    const realtimeClient = createClient(url, key);
    const presenceState = new Map<string, PresencePayload>();

    const channel = realtimeClient
      .channel(`document:${documentId}`, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
          presence: { key: userId },
        },
      })
      // Listen for content updates via broadcast
      .on("broadcast", { event: "content_update" }, (payload) => {
        const data = payload.payload as DocumentContentPayload;
        if (data.userId !== userId) {
          callbacks.onContentUpdate(data.content, data.userId);
        }
      })
      // Track presence of other editors
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        presenceState.clear();

        for (const key in state) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            // Get the most recent presence for each user
            const latestPresence = presences[presences.length - 1];
            if (latestPresence && latestPresence.userId !== userId) {
              presenceState.set(latestPresence.userId, latestPresence);
            }
          }
        }

        callbacks.onPresenceUpdate(presenceState);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        for (const presence of newPresences) {
          const data = presence as unknown as PresencePayload;
          if (data.userId !== userId) {
            presenceState.set(data.userId, data);
          }
        }
        callbacks.onPresenceUpdate(presenceState);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        for (const presence of leftPresences) {
          const data = presence as unknown as PresencePayload;
          presenceState.delete(data.userId);
        }
        callbacks.onPresenceUpdate(presenceState);
      });

    await channel.subscribe();

    return {
      broadcastContent: (content: Record<string, unknown>, senderId: string) => {
        channel.send({
          type: "broadcast",
          event: "content_update",
          payload: {
            type: "content_update",
            content,
            userId: senderId,
            timestamp: Date.now(),
          } as DocumentContentPayload,
        });
      },
      updatePresence: (presence: PresencePayload) => {
        channel.track(presence);
      },
      unsubscribe: () => {
        realtimeClient.removeChannel(channel);
      },
    };
  } catch (e) {
    console.warn("Failed to set up document realtime subscription:", e);
    return {
      broadcastContent: () => {},
      updatePresence: () => {},
      unsubscribe: () => {},
    };
  }
};
