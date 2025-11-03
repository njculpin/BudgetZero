import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { createSignal, onMount, onCleanup } from "solid-js";

interface AssetChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at?: string;
}

interface AssetChatProps {
  userId: string;
  assetId: string;
}

export default function AssetChat(props: AssetChatProps) {
  const [messages, setMessages] = createSignal<AssetChatMessage[]>([]);
  const [message, setMessage] = createSignal("");
  let channel: any = null;
  let dataClient: any = null; // lazy init

  const loadMessages = async () => {
    const { data, error } = await dataClient
      .from("asset_chat_messages")
      .select("*")
      .eq("asset_id", props.assetId)
      .order("created_at", { ascending: true });
    if (error) console.error(error);
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    const text = message().trim();
    if (!text) return;
    try {
      const response = await fetch("/api/assets/chat/add-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: props.assetId, userId: props.userId, message: text })
      });
      if (!response.ok){
        throw response.statusText
      }
      await loadMessages()
      setMessage("");
    } catch(e){
      console.log(e)
    }
  };

  onMount(async () => {
    // Only create client on the client side
    const { createClient } = await import("@supabase/supabase-js");
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing PUBLIC_SUPABASE envs");
    dataClient = createClient(url, key);

    // Load existing messages
    await loadMessages();

    // Realtime subscription
      channel = dataClient
      .channel(`realtime:asset_chat_messages:${props.assetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "asset_chat_messages",
          filter: `asset_id=eq.${props.assetId}`,
        },
        (payload: RealtimePostgresInsertPayload<AssetChatMessage>) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
  });

  onCleanup(() => {
    if (channel) dataClient?.removeChannel(channel);
  });

  return (
    <div>
      <div style="height:400px; overflow-y:auto;">
        {messages().map((msg) => (
          <div style="padding:4px; border-bottom:1px dashed #ccc;">
            <strong>{msg.user_id === props.userId ? "You" : msg.user_id}:</strong>{" "}
            {msg.message}
          </div>
        ))}
      </div>
      <div>
        <input
          value={message()}
          onInput={(e) => setMessage((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
