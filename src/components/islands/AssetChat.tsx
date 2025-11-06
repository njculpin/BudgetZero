import { createSignal, onMount, onCleanup, For } from "solid-js";
import {
  getAssetChatMessages,
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
  let unsubscribe: (() => void) | null = null;

  const loadMessages = async () => {
    const data = await getAssetChatMessages(props.assetId);
    setMessages(data);
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

  return (
    <div class="asset-chat">
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
                {msg.user_id === props.userId ? "You" : msg.user_id}
              </span>
              <p class="asset-chat__message-text">{msg.message}</p>
            </div>
          )}
        </For>
      </div>

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
            disabled={isLoading() || !message().trim()}
          >
            {isLoading() ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
