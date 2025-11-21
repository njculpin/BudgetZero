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
        <div class="asset-chat__messages">
          <For each={chat.messages()}>
            {(msg) => (
              <div
                class="asset-chat__message"
                classList={{
                  "asset-chat__message--own": msg.user_id === props.userId,
                }}
              >
                <span class="asset-chat__message-author">
                  {chat.getUserDisplay(msg)}
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
          chat.sendMessage();
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
