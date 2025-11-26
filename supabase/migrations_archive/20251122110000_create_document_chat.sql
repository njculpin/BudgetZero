-- Create document chat messages table
CREATE TABLE IF NOT EXISTS document_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS document_chat_messages_document_id_idx ON document_chat_messages(document_id);
CREATE INDEX IF NOT EXISTS document_chat_messages_user_id_idx ON document_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS document_chat_messages_created_at_idx ON document_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE document_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only document collaborators can view and send messages
CREATE POLICY "Document collaborators can view chat messages"
  ON document_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_collaborators.document_id = document_chat_messages.document_id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Document collaborators can insert chat messages"
  ON document_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_collaborators.document_id = document_chat_messages.document_id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.deleted = FALSE
    )
  );

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE document_chat_messages;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_document_chat_messages
  BEFORE UPDATE ON document_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
