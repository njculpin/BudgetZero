import { createSignal, onMount, onCleanup, For } from "solid-js";
import {
  subscribeToProductChat,
  type ProductChatMessage,
} from "@/lib/data-access/product-chat";
import "./product-chat.css";

interface ProductChatProps {
  userId: string | undefined;
  productId: string;
}

export default function ProductChat(props: ProductChatProps) {
  const [messages, setMessages] = createSignal<ProductChatMessage[]>([]);
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
      const response = await fetch(`/api/products/chat/get-messages?productId=${props.productId}`);

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
      const response = await fetch("/api/products/chat/add-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
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
    unsubscribe = await subscribeToProductChat(props.productId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });
  });

  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  const getUserDisplay = (msg: ProductChatMessage) => {
    if (msg.user_id === props.userId) return "You";
    if (msg.user?.name) return msg.user.name;
    if (msg.user?.handle) return `@${msg.user.handle}`;
    return "Unknown User";
  };

  return (
    <div class="product-chat">
      {error() && (
        <div class="product-chat__error">
          <p>{error()}</p>
          <button onClick={loadMessages} class="product-chat__retry">
            Retry
          </button>
        </div>
      )}

      {isFetching() && messages().length === 0 ? (
        <div class="product-chat__loading">
          <div class="product-chat__spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : messages().length === 0 ? (
        <div class="product-chat__empty">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div class="product-chat__messages">
          <For each={messages()}>
            {(msg) => (
              <div
                class="product-chat__message"
                classList={{
                  "product-chat__message--own": msg.user_id === props.userId,
                }}
              >
                <span class="product-chat__message-author">
                  {getUserDisplay(msg)}
                </span>
                <p class="product-chat__message-text">{msg.message}</p>
              </div>
            )}
          </For>
        </div>
      )}

      <form
        class="product-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <label for="chat-input" class="product-chat__label">
          Send a message to product collaborators
        </label>
        <div class="product-chat__input-wrapper">
          <input
            id="chat-input"
            type="text"
            class="product-chat__input"
            value={message()}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="Type a message..."
            disabled={isLoading()}
            aria-label="Chat message"
          />
          <button
            type="submit"
            class="product-chat__submit"
            // disabled={isDisabled()}
            title={!props.userId ? "Sign in to send messages" : ""}
          >
            {isLoading() ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
