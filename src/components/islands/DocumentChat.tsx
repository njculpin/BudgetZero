import { For } from "solid-js";
import { useChat } from "@/lib/hooks/useChat";
import {
  subscribeToDocumentChat,
  type DocumentChatMessage,
} from "@/lib/realtime/document-chat-subscription";
import "./document-chat.css";

interface DocumentChatProps {
  userId: string | undefined;
  documentId: string;
}

export default function DocumentChat(props: DocumentChatProps) {
  const chat = useChat<DocumentChatMessage>({
    entityId: props.documentId,
    userId: props.userId,
    getMessagesEndpoint: "/api/documents/chat/get-messages",
    entityParamName: "documentId",
    sendMessageEndpoint: "/api/documents/chat/add-message",
    subscribeToChat: subscribeToDocumentChat,
  });

  const getInitials = (msg: DocumentChatMessage): string => {
    if (msg.user?.name) {
      return msg.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (msg.user?.handle) {
      return msg.user.handle.slice(0, 2).toUpperCase();
    }
    return "?";
  };

  return (
    <div class="document-chat">
      {chat.error() && (
        <div class="document-chat__error">
          <p>{chat.error()}</p>
          <button onClick={chat.loadMessages} class="document-chat__retry">
            Retry
          </button>
        </div>
      )}

      {chat.isFetching() && chat.messages().length === 0 ? (
        <div class="document-chat__loading">
          <div class="document-chat__spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : chat.messages().length === 0 ? (
        <div class="document-chat__empty">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div class="document-chat__messages">
          <For each={chat.messages()}>
            {(msg) => {
              const isOwn = msg.user_id === props.userId;
              return (
                <div
                  class="document-chat__message-row"
                  classList={{ "document-chat__message-row--own": isOwn }}
                >
                  {!isOwn && (
                    <div class="document-chat__avatar">
                      {msg.user?.avatar_url ? (
                        <img
                          src={msg.user.avatar_url}
                          alt={chat.getUserDisplay(msg)}
                          class="document-chat__avatar-img"
                          loading="lazy"
                        />
                      ) : (
                        <span class="document-chat__avatar-initials">
                          {getInitials(msg)}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    class="document-chat__message"
                    classList={{ "document-chat__message--own": isOwn }}
                  >
                    <span class="document-chat__message-author">
                      {chat.getUserDisplay(msg)}
                    </span>
                    <p class="document-chat__message-text">{msg.message}</p>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      )}

      <form
        class="document-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          chat.sendMessage();
        }}
      >
        <label for="document-chat-input" class="document-chat__label">
          Send a message to document collaborators
        </label>
        <div class="document-chat__input-wrapper">
          <input
            id="document-chat-input"
            type="text"
            class="document-chat__input"
            value={chat.message()}
            onInput={(e) => chat.setMessage(e.currentTarget.value)}
            placeholder="Type a message..."
            disabled={chat.isLoading()}
            aria-label="Chat message"
          />
          <button
            type="submit"
            class="document-chat__submit"
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
