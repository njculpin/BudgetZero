import { For } from "solid-js";
import { useChat, type BaseChatMessage } from "@/lib/hooks/useChat";
import { subscribeToProductChat } from "@/lib/realtime/product-chat-subscription";
import { subscribeToDocumentChat } from "@/lib/realtime/document-chat-subscription";
import "./entity-chat.css";

type EntityType = "product" | "document";

interface EntityChatMessage extends BaseChatMessage {
  product_id?: string;
  document_id?: string;
}

interface EntityChatProps {
  entityType: EntityType;
  entityId: string;
  userId: string | undefined;
}

const entityConfig: Record<EntityType, {
  getMessagesEndpoint: string;
  entityParamName: string;
  sendMessageEndpoint: string;
  subscribeToChat: (entityId: string, onMessage: (message: EntityChatMessage) => void) => Promise<() => void>;
  labelText: string;
}> = {
  product: {
    getMessagesEndpoint: "/api/products/chat/get-messages",
    entityParamName: "productId",
    sendMessageEndpoint: "/api/products/chat/add-message",
    subscribeToChat: subscribeToProductChat,
    labelText: "Send a message to product collaborators",
  },
  document: {
    getMessagesEndpoint: "/api/documents/chat/get-messages",
    entityParamName: "documentId",
    sendMessageEndpoint: "/api/documents/chat/add-message",
    subscribeToChat: subscribeToDocumentChat,
    labelText: "Send a message to document collaborators",
  },
};

export default function EntityChat(props: EntityChatProps) {
  const config = entityConfig[props.entityType];

  const chat = useChat<EntityChatMessage>({
    entityId: props.entityId,
    userId: props.userId,
    getMessagesEndpoint: config.getMessagesEndpoint,
    entityParamName: config.entityParamName,
    sendMessageEndpoint: config.sendMessageEndpoint,
    subscribeToChat: config.subscribeToChat,
  });

  const getInitials = (msg: EntityChatMessage): string => {
    if (msg.user?.name) {
      return msg.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (msg.user?.handle) {
      return msg.user.handle.slice(0, 2).toUpperCase();
    }
    return "?";
  };

  return (
    <div class="entity-chat">
      {chat.error() && (
        <div class="entity-chat__error">
          <p>{chat.error()}</p>
          <button onClick={chat.loadMessages} class="entity-chat__retry">
            Retry
          </button>
        </div>
      )}

      {chat.isFetching() && chat.messages().length === 0 ? (
        <div class="entity-chat__loading">
          <div class="entity-chat__spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : chat.messages().length === 0 ? (
        <div class="entity-chat__empty">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div class="entity-chat__messages">
          <For each={chat.messages()}>
            {(msg) => {
              const isOwn = msg.user_id === props.userId;
              return (
                <div
                  class="entity-chat__message-row"
                  classList={{ "entity-chat__message-row--own": isOwn }}
                >
                  {!isOwn && (
                    <div class="entity-chat__avatar">
                      {msg.user?.avatar_url ? (
                        <img
                          src={msg.user.avatar_url}
                          alt={chat.getUserDisplay(msg)}
                          class="entity-chat__avatar-img"
                        />
                      ) : (
                        <span class="entity-chat__avatar-initials">
                          {getInitials(msg)}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    class="entity-chat__message"
                    classList={{ "entity-chat__message--own": isOwn }}
                  >
                    <span class="entity-chat__message-author">
                      {chat.getUserDisplay(msg)}
                    </span>
                    <p class="entity-chat__message-text">{msg.message}</p>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      )}

      <form
        class="entity-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          chat.sendMessage();
        }}
      >
        <label for={`${props.entityType}-chat-input`} class="entity-chat__label">
          {config.labelText}
        </label>
        <div class="entity-chat__input-wrapper">
          <input
            id={`${props.entityType}-chat-input`}
            type="text"
            class="entity-chat__input"
            value={chat.message()}
            onInput={(e) => chat.setMessage(e.currentTarget.value)}
            placeholder="Type a message..."
            disabled={chat.isLoading()}
            aria-label="Chat message"
          />
          <button
            type="submit"
            class="entity-chat__submit"
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
