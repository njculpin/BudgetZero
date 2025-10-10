// TODO: Implement actual realtime chat hook
export interface ChatMessage {
  id: string;
  text: string;
  content: string;
  sender_id: string;
  sender_name: string;
  timestamp: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export function useRealtimeChat(
  _params: { roomName: string; username?: string } | string,
) {
  return {
    messages: [] as ChatMessage[],
    sendMessage: async (_message: string) => {},
    isConnected: false,
    isLoading: false,
  };
}
