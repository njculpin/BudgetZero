-- Create document system tables
-- Notion-like collaborative document editing with blocks

-- ============================================
-- DOCUMENTS TABLE
-- ============================================

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- DOCUMENT BLOCKS TABLE
-- ============================================

-- Create document_blocks table (Notion-like blocks)
CREATE TABLE IF NOT EXISTS document_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('paragraph', 'heading', 'list_item', 'image', 'code', 'table', 'quote', 'callout')),
  content JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- DOCUMENT ATTACHMENTS TABLE
-- ============================================

-- Create document_attachments table
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
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

-- ============================================
-- DOCUMENT COLLABORATORS TABLE
-- ============================================

-- Create document_collaborators table
CREATE TABLE IF NOT EXISTS document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for documents
CREATE INDEX IF NOT EXISTS documents_handle_idx ON documents(handle);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

-- Indexes for document_blocks
CREATE INDEX IF NOT EXISTS document_blocks_document_id_idx ON document_blocks(document_id);
CREATE INDEX IF NOT EXISTS document_blocks_parent_id_idx ON document_blocks(parent_id);
CREATE INDEX IF NOT EXISTS document_blocks_position_idx ON document_blocks(position);
CREATE INDEX IF NOT EXISTS document_blocks_block_type_idx ON document_blocks(block_type);

-- Indexes for document_attachments
CREATE INDEX IF NOT EXISTS document_attachments_document_id_idx ON document_attachments(document_id);

-- Indexes for document_collaborators
CREATE INDEX IF NOT EXISTS document_collaborators_document_id_idx ON document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS document_collaborators_user_id_idx ON document_collaborators(user_id);
CREATE INDEX IF NOT EXISTS document_collaborators_role_idx ON document_collaborators(role);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Document owners can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Document collaborators can view documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_collaborators.document_id = documents.id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Document owners can update documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Editors can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_collaborators.document_id = documents.id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.can_edit = TRUE
      AND document_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Document owners can delete documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for document_blocks
CREATE POLICY "Blocks visible via document access"
  ON document_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_blocks.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.deleted = FALSE
        )
      )
      AND documents.deleted = FALSE
    )
  );

CREATE POLICY "Document editors can manage blocks"
  ON document_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_blocks.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM document_collaborators
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
  ON document_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_attachments.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.deleted = FALSE
        )
      )
      AND documents.deleted = FALSE
    )
  );

CREATE POLICY "Document editors can manage attachments"
  ON document_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_attachments.document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM document_collaborators
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
  ON document_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_collaborators.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can manage collaborators"
  ON document_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_collaborators.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Inviters can manage collaborators"
  ON document_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_collaborators dc
      WHERE dc.document_id = document_id
      AND dc.user_id = auth.uid()
      AND dc.can_invite = TRUE
      AND dc.deleted = FALSE
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_document_blocks
  BEFORE UPDATE ON document_blocks
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_document_attachments
  BEFORE UPDATE ON document_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_document_collaborators
  BEFORE UPDATE ON document_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
