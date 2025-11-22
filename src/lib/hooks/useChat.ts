import { createSignal, onMount, onCleanup, type Accessor, type Setter } from "solid-js";

/**
 * Base chat message structure with user info
 */
export interface BaseChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  user?: {
    name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
  } | null;
}

/**
 * Configuration for the useChat hook
 */
export interface UseChatConfig<T extends BaseChatMessage> {
  /** The entity ID (productId or assetId) */
  entityId: string;
  /** The current user's ID (undefined if not logged in) */
  userId: string | undefined;
  /** API endpoint for fetching messages (e.g., "/api/products/chat/get-messages") */
  getMessagesEndpoint: string;
  /** Query param name for the entity (e.g., "productId" or "assetId") */
  entityParamName: string;
  /** API endpoint for sending messages (e.g., "/api/products/chat/add-message") */
  sendMessageEndpoint: string;
  /** Function to subscribe to realtime updates */
  subscribeToChat: (entityId: string, onMessage: (message: T) => void) => Promise<() => void>;
}

/**
 * Return type for the useChat hook
 */
export interface UseChatReturn<T extends BaseChatMessage> {
  messages: Accessor<T[]>;
  setMessages: Setter<T[]>;
  message: Accessor<string>;
  setMessage: Setter<string>;
  isLoading: Accessor<boolean>;
  isFetching: Accessor<boolean>;
  error: Accessor<string | null>;
  isDisabled: Accessor<boolean>;
  loadMessages: () => Promise<void>;
  sendMessage: () => Promise<void>;
  getUserDisplay: (msg: T) => string;
}

/**
 * Shared hook for chat functionality
 * Handles message loading, sending, and realtime subscriptions
 */
export function useChat<T extends BaseChatMessage>(
  config: UseChatConfig<T>
): UseChatReturn<T> {
  const [messages, setMessages] = createSignal<T[]>([]);
  const [message, setMessage] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [isFetching, setIsFetching] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  // Computed: whether the send button should be disabled
  const isDisabled = () => {
    const hasNoMessage = !message().trim();
    const hasNoUser = !config.userId;
    return isLoading() || hasNoMessage || hasNoUser;
  };

  const loadMessages = async () => {
    try {
      setIsFetching(true);
      setError(null);
      const response = await fetch(
        `${config.getMessagesEndpoint}?${config.entityParamName}=${config.entityId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to load messages:", errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data);
    } catch (e) {
      console.error("Failed to load messages:", e);
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setIsFetching(false);
    }
  };

  const sendMessage = async () => {
    const text = message().trim();
    if (!text || !config.userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(config.sendMessageEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [config.entityParamName]: config.entityId,
          userId: config.userId,
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      await loadMessages();
      setMessage("");
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDisplay = (msg: T): string => {
    if (msg.user_id === config.userId) return "You";
    if (msg.user?.name) return msg.user.name;
    if (msg.user?.handle) return `@${msg.user.handle}`;
    return "Unknown User";
  };

  onMount(async () => {
    // Load existing messages
    await loadMessages();

    // Subscribe to realtime updates (gracefully handle failures)
    try {
      unsubscribe = await config.subscribeToChat(config.entityId, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });
    } catch (e) {
      console.warn("Realtime subscription failed, chat will work without live updates:", e);
    }
  });

  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  return {
    messages,
    setMessages,
    message,
    setMessage,
    isLoading,
    isFetching,
    error,
    isDisabled,
    loadMessages,
    sendMessage,
    getUserDisplay,
  };
}
