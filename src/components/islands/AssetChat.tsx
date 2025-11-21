import { createSignal, onMount, onCleanup, For } from "solid-js";
import {
  subscribeToAssetChat,
  type AssetChatMessage,
} from "@/lib/data-access/asset-chat";
import "./asset-chat.css";

interface AssetChatProps {
  userId: string | undefined;
  assetId: string;
}

export default function AssetChat(props: AssetChatProps) {
  const [messages, setMessages] = createSignal<AssetChatMessage[]>([]);
  const [message, setMessage] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [isFetching, setIsFetching] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  // Computed: whether the send button should be disabled
  const isDisabled = () => {
    return isLoading() || !message().trim() || !props.userId;
  };

  const loadMessages = async () => {
    try {
      setIsFetching(true);
      setError(null);
      const response = await fetch(`/api/assets/chat/get-messages?assetId=${props.assetId}`);

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
    if (!text || !props.userId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/assets/chat/add-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: props.assetId,
          userId: props.userId,
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

  onMount(async () => {
    // Load existing messages
    await loadMessages();

    // Subscribe to realtime updates
    unsubscribe = await subscribeToAssetChat(props.assetId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });
  });

  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  const getUserDisplay = (msg: AssetChatMessage) => {
    if (msg.user_id === props.userId) return "You";
    if (msg.user?.name) return msg.user.name;
    if (msg.user?.handle) return `@${msg.user.handle}`;
    return "Unknown User";
  };

  return (
    <div class="asset-chat">
      {error() && (
        <div class="asset-chat__error">
          <p>{error()}</p>
          <button onClick={loadMessages} class="asset-chat__retry">
            Retry
          </button>
        </div>
      )}

      {isFetching() && messages().length === 0 ? (
        <div class="asset-chat__loading">
          <div class="asset-chat__spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : messages().length === 0 ? (
        <div class="asset-chat__empty">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div class="asset-chat__messages">
          <For each={messages()}>
            {(msg) => (
              <div
                class="asset-chat__message"
                classList={{
                  "asset-chat__message--own": msg.user_id === props.userId,
                }}
              >
                <span class="asset-chat__message-author">
                  {getUserDisplay(msg)}
                </span>
                <p class="asset-chat__message-text">{msg.message}</p>
              </div>
            )}
          </For>
        </div>
      )}

      <form
        class="asset-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <label for="chat-input" class="asset-chat__label">
          Send a message to asset contributors
        </label>
        <div class="asset-chat__input-wrapper">
          <input
            id="chat-input"
            type="text"
            class="asset-chat__input"
            value={message()}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="Type a message..."
            disabled={isLoading()}
            aria-label="Chat message"
          />
          <button
            type="submit"
            class="asset-chat__submit"
            disabled={isDisabled()}
            title={!props.userId ? "Sign in to send messages" : ""}
          >
            {isLoading() ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
