import { createSignal, onMount, onCleanup, For } from "solid-js";
import {
  getProductChatMessages,
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
  let unsubscribe: (() => void) | null = null;

  // Computed: whether the send button should be disabled
  const isDisabled = () => {
    return isLoading() || !message().trim() || !props.userId;
  };

  const loadMessages = async () => {
    const data = await getProductChatMessages(props.productId);
    setMessages(data);
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

  return (
    <div class="product-chat">
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
                {msg.user_id === props.userId ? "You" : msg.user_id}
              </span>
              <p class="product-chat__message-text">{msg.message}</p>
            </div>
          )}
        </For>
      </div>

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
