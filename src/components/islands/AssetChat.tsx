import { For } from "solid-js";
import { useChat } from "@/lib/hooks/useChat";
import {
  subscribeToAssetChat,
  type AssetChatMessage,
} from "@/lib/realtime/asset-chat-subscription";
import "./asset-chat.css";

interface AssetChatProps {
  userId: string | undefined;
  assetId: string;
}

export default function AssetChat(props: AssetChatProps) {
  const chat = useChat<AssetChatMessage>({
    entityId: props.assetId,
    userId: props.userId,
    getMessagesEndpoint: "/api/assets/chat/get-messages",
    entityParamName: "assetId",
    sendMessageEndpoint: "/api/assets/chat/add-message",
    subscribeToChat: subscribeToAssetChat,
  });

  const getInitials = (msg: AssetChatMessage): string => {
    if (msg.user?.name) {
      return msg.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (msg.user?.handle) {
      return msg.user.handle.slice(0, 2).toUpperCase();
    }
    return "?";
  };

  return (
    <div class="asset-chat">
      {chat.error() && (
        <div class="asset-chat__error">
          <p>{chat.error()}</p>
          <button onClick={chat.loadMessages} class="asset-chat__retry">
            Retry
          </button>
        </div>
      )}

      {chat.isFetching() && chat.messages().length === 0 ? (
        <div class="asset-chat__loading">
          <div class="asset-chat__spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : chat.messages().length === 0 ? (
        <div class="asset-chat__empty">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div class="asset-chat__messages" aria-live="polite" aria-label="Chat messages">
          <For each={chat.messages()}>
            {(msg) => {
              const isOwn = msg.user_id === props.userId;
              return (
                <div
                  class="asset-chat__message-row"
                  classList={{ "asset-chat__message-row--own": isOwn }}
                >
                  {!isOwn && (
                    <div class="asset-chat__avatar">
                      {msg.user?.avatar_url ? (
                        <img
                          src={msg.user.avatar_url}
                          alt={chat.getUserDisplay(msg)}
                          class="asset-chat__avatar-img"
                        />
                      ) : (
                        <span class="asset-chat__avatar-initials">
                          {getInitials(msg)}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    class="asset-chat__message"
                    classList={{ "asset-chat__message--own": isOwn }}
                  >
                    <span class="asset-chat__message-author">
                      {chat.getUserDisplay(msg)}
                    </span>
                    <p class="asset-chat__message-text">{msg.message}</p>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      )}

      <form
        class="asset-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          chat.sendMessage();
        }}
      >
        <label for="asset-chat-input" class="asset-chat__label">
          Send a message to asset contributors
        </label>
        <div class="asset-chat__input-wrapper">
          <input
            id="asset-chat-input"
            type="text"
            class="asset-chat__input"
            value={chat.message()}
            onInput={(e) => chat.setMessage(e.currentTarget.value)}
            placeholder="Type a message..."
            disabled={chat.isLoading()}
            aria-label="Chat message"
          />
          <button
            type="submit"
            class="asset-chat__submit"
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
