-- Documents Domain
-- Collaborative documents with blocks (Notion-like), collaborators, attachments, and chat

-- ============================================
-- 1. DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content JSONB DEFAULT '{"type": "doc", "content": [{"type": "paragraph"}]}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.documents IS 'Collaborative documents with TipTap editor content';
COMMENT ON COLUMN public.documents.content IS 'TipTap editor content stored as JSON';

-- ============================================
-- 2. DOCUMENT BLOCKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.document_blocks(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('paragraph', 'heading', 'list_item', 'image', 'code', 'table', 'quote', 'callout')),
  content JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.document_blocks IS 'Notion-like blocks for structured document content';

-- ============================================
-- 3. DOCUMENT ATTACHMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.document_attachments IS 'File attachments for documents';

-- ============================================
-- 4. DOCUMENT COLLABORATORS
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  can_invite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(document_id, user_id)
);

COMMENT ON TABLE public.document_collaborators IS 'Users with access to private documents (owner, editor, viewer)';

-- ============================================
-- 5. DOCUMENT CHAT
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.document_chat_messages IS 'Chat messages for document collaborators';

-- ============================================
-- 6. INDEXES
-- ============================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS documents_handle_idx ON public.documents(handle);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS documents_content_idx ON public.documents USING GIN (content);

-- Document blocks indexes
CREATE INDEX IF NOT EXISTS document_blocks_document_id_idx ON public.document_blocks(document_id);
CREATE INDEX IF NOT EXISTS document_blocks_parent_id_idx ON public.document_blocks(parent_id);
CREATE INDEX IF NOT EXISTS document_blocks_position_idx ON public.document_blocks(position);
CREATE INDEX IF NOT EXISTS document_blocks_block_type_idx ON public.document_blocks(block_type);

-- Document attachments indexes
CREATE INDEX IF NOT EXISTS document_attachments_document_id_idx ON public.document_attachments(document_id);

-- Document collaborators indexes
CREATE INDEX IF NOT EXISTS document_collaborators_document_id_idx ON public.document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS document_collaborators_user_id_idx ON public.document_collaborators(user_id);
CREATE INDEX IF NOT EXISTS document_collaborators_role_idx ON public.document_collaborators(role);

-- Document chat indexes
CREATE INDEX IF NOT EXISTS document_chat_messages_document_id_idx ON public.document_chat_messages(document_id);
CREATE INDEX IF NOT EXISTS document_chat_messages_user_id_idx ON public.document_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS document_chat_messages_created_at_idx ON public.document_chat_messages(created_at DESC);

-- ============================================
-- 7. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_document_blocks
  BEFORE UPDATE ON public.document_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_document_attachments
  BEFORE UPDATE ON public.document_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_document_collaborators
  BEFORE UPDATE ON public.document_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_document_chat_messages
  BEFORE UPDATE ON public.document_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Document owners can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Document collaborators can view documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators
      WHERE document_collaborators.document_id = documents.id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Users can create own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Document owners can update documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Editors can update documents"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators
      WHERE document_collaborators.document_id = documents.id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.can_edit = TRUE
      AND document_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Document owners can delete documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for document_blocks
CREATE POLICY "Blocks visible via document access"
  ON public.document_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_blocks.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.deleted = FALSE
        )
      )
      AND documents.deleted = FALSE
    )
  );

CREATE POLICY "Document editors can manage blocks"
  ON public.document_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_blocks.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.can_edit = TRUE
          AND document_collaborators.deleted = FALSE
        )
      )
    )
  );

-- RLS Policies for document_attachments
CREATE POLICY "Attachments visible via document access"
  ON public.document_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_attachments.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.deleted = FALSE
        )
      )
      AND documents.deleted = FALSE
    )
  );

CREATE POLICY "Document editors can manage attachments"
  ON public.document_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_attachments.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.can_edit = TRUE
          AND document_collaborators.deleted = FALSE
        )
      )
    )
  );

-- RLS Policies for document_collaborators
CREATE POLICY "Collaborators visible to document team"
  ON public.document_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_collaborators.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can manage collaborators"
  ON public.document_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_collaborators.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Inviters can manage collaborators"
  ON public.document_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc
      WHERE dc.document_id = document_id
      AND dc.user_id = auth.uid()
      AND dc.can_invite = TRUE
      AND dc.deleted = FALSE
    )
  );

-- RLS Policies for document_chat_messages
CREATE POLICY "Document collaborators can view chat messages"
  ON public.document_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators
      WHERE document_collaborators.document_id = document_chat_messages.document_id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Document collaborators can insert chat messages"
  ON public.document_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.document_collaborators
      WHERE document_collaborators.document_id = document_chat_messages.document_id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.deleted = FALSE
    )
  );
