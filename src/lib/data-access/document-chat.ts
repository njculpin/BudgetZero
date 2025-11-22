import { serverClient } from "./client";

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
 * Get all chat messages for a document with user information
 */
export const getDocumentChatMessages = async (
  documentId: string
): Promise<DocumentChatMessage[]> => {
  const { data, error } = await serverClient
    .from("document_chat_messages")
    .select(`
      *,
      user:users!user_id (
        name,
        handle,
        avatar_url
      )
    `)
    .eq("document_id", documentId)
    .eq("deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching document chat messages:", error);
    return [];
  }

  return (data as DocumentChatMessage[]) || [];
};

/**
 * Create a new chat message
 */
export const createDocumentChatMessage = async (
  documentId: string,
  userId: string,
  message: string
): Promise<DocumentChatMessage | null> => {
  const { data, error } = await serverClient
    .from("document_chat_messages")
    .insert({
      document_id: documentId,
      user_id: userId,
      message: message,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document chat message:", error);
    return null;
  }

  return data as DocumentChatMessage;
};
