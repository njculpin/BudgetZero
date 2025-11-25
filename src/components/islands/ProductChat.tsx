import { For } from "solid-js";
import { useChat } from "@/lib/hooks/useChat";
import {
  subscribeToProductChat,
  type ProductChatMessage,
} from "@/lib/realtime/product-chat-subscription";
import "./product-chat.css";

interface ProductChatProps {
  userId: string | undefined;
  productId: string;
}

export default function ProductChat(props: ProductChatProps) {
  const chat = useChat<ProductChatMessage>({
    entityId: props.productId,
    userId: props.userId,
    getMessagesEndpoint: "/api/products/chat/get-messages",
    entityParamName: "productId",
    sendMessageEndpoint: "/api/products/chat/add-message",
    subscribeToChat: subscribeToProductChat,
  });

  const getInitials = (msg: ProductChatMessage): string => {
    if (msg.user?.name) {
      return msg.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (msg.user?.handle) {
      return msg.user.handle.slice(0, 2).toUpperCase();
    }
    return "?";
  };

  return (
    <div class="product-chat">
      {chat.error() && (
        <div class="product-chat__error">
          <p>{chat.error()}</p>
          <button onClick={chat.loadMessages} class="product-chat__retry">
            Retry
          </button>
        </div>
      )}

      {chat.isFetching() && chat.messages().length === 0 ? (
        <div class="product-chat__loading">
          <div class="product-chat__spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : chat.messages().length === 0 ? (
        <div class="product-chat__empty">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div class="product-chat__messages" aria-live="polite" aria-label="Chat messages">
          <For each={chat.messages()}>
            {(msg) => {
              const isOwn = msg.user_id === props.userId;
              return (
                <div
                  class="product-chat__message-row"
                  classList={{ "product-chat__message-row--own": isOwn }}
                >
                  {!isOwn && (
                    <div class="product-chat__avatar">
                      {msg.user?.avatar_url ? (
                        <img
                          src={msg.user.avatar_url}
                          alt={chat.getUserDisplay(msg)}
                          class="product-chat__avatar-img"
                        />
                      ) : (
                        <span class="product-chat__avatar-initials">
                          {getInitials(msg)}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    class="product-chat__message"
                    classList={{ "product-chat__message--own": isOwn }}
                  >
                    <span class="product-chat__message-author">
                      {chat.getUserDisplay(msg)}
                    </span>
                    <p class="product-chat__message-text">{msg.message}</p>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      )}

      <form
        class="product-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          chat.sendMessage();
        }}
      >
        <label for="product-chat-input" class="product-chat__label">
          Send a message to product collaborators
        </label>
        <div class="product-chat__input-wrapper">
          <input
            id="product-chat-input"
            type="text"
            class="product-chat__input"
            value={chat.message()}
            onInput={(e) => chat.setMessage(e.currentTarget.value)}
            placeholder="Type a message..."
            disabled={chat.isLoading()}
            aria-label="Chat message"
          />
          <button
            type="submit"
            class="product-chat__submit"
            disabled={chat.isDisabled()}
            title={!props.userId ? "Sign in to send messages" : ""}
          >
            {chat.isLoading() ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
