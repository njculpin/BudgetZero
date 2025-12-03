-- Create extended asset tables
-- Includes: collaborators, licenses, chat system, downloads

-- ============================================
-- ASSET COLLABORATORS
-- ============================================

-- Create asset_collaborators table
CREATE TABLE IF NOT EXISTS asset_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(asset_id, user_id)
);

-- ============================================
-- ASSET LICENSES
-- ============================================

-- Create asset_licenses table (links assets to licenses)
CREATE TABLE IF NOT EXISTS asset_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- ASSET CHAT SYSTEM
-- ============================================

-- Create asset_chat_messages table
CREATE TABLE IF NOT EXISTS asset_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create asset_chat_message_reactions table
CREATE TABLE IF NOT EXISTS asset_chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES asset_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id, emoji)
);

-- Create asset_chat_message_attachments table
CREATE TABLE IF NOT EXISTS asset_chat_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES asset_chat_messages(id) ON DELETE CASCADE,
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
-- ASSET DOWNLOADS
-- ============================================

-- Create asset_downloads table (temporary download links)
CREATE TABLE IF NOT EXISTS asset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  download_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for asset_collaborators
CREATE INDEX IF NOT EXISTS asset_collaborators_asset_id_idx ON asset_collaborators(asset_id);
CREATE INDEX IF NOT EXISTS asset_collaborators_user_id_idx ON asset_collaborators(user_id);

-- Indexes for asset_licenses
CREATE INDEX IF NOT EXISTS asset_licenses_asset_id_idx ON asset_licenses(asset_id);
CREATE INDEX IF NOT EXISTS asset_licenses_license_id_idx ON asset_licenses(license_id);
CREATE INDEX IF NOT EXISTS asset_licenses_is_active_idx ON asset_licenses(is_active);
CREATE INDEX IF NOT EXISTS asset_licenses_expires_at_idx ON asset_licenses(expires_at);

-- Indexes for asset_chat_messages
CREATE INDEX IF NOT EXISTS asset_chat_messages_asset_id_idx ON asset_chat_messages(asset_id);
CREATE INDEX IF NOT EXISTS asset_chat_messages_user_id_idx ON asset_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS asset_chat_messages_created_at_idx ON asset_chat_messages(created_at DESC);

-- Indexes for asset_chat_message_reactions
CREATE INDEX IF NOT EXISTS asset_chat_message_reactions_message_id_idx ON asset_chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS asset_chat_message_reactions_user_id_idx ON asset_chat_message_reactions(user_id);

-- Indexes for asset_chat_message_attachments
CREATE INDEX IF NOT EXISTS asset_chat_message_attachments_message_id_idx ON asset_chat_message_attachments(message_id);

-- Indexes for asset_downloads
CREATE INDEX IF NOT EXISTS asset_downloads_asset_id_idx ON asset_downloads(asset_id);
CREATE INDEX IF NOT EXISTS asset_downloads_user_id_idx ON asset_downloads(user_id);
CREATE INDEX IF NOT EXISTS asset_downloads_sale_id_idx ON asset_downloads(sale_id);
CREATE INDEX IF NOT EXISTS asset_downloads_expires_at_idx ON asset_downloads(expires_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE asset_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_collaborators
CREATE POLICY "Collaborators visible to asset team"
  ON asset_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_collaborators.asset_id
      AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Asset owners can manage collaborators"
  ON asset_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_collaborators.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_licenses
CREATE POLICY "Licenses visible for public assets"
  ON asset_licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_licenses.asset_id
      AND (assets.status = 'public' OR assets.user_id = auth.uid())
      AND assets.deleted = FALSE
    )
  );

CREATE POLICY "Asset owners can manage licenses"
  ON asset_licenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_licenses.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_chat_messages
CREATE POLICY "Chat messages visible for public assets"
  ON asset_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_chat_messages.asset_id
      AND assets.status = 'public'
      AND assets.deleted = FALSE
    )
  );

CREATE POLICY "Authenticated users can post chat messages"
  ON asset_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_id
      AND assets.status = 'public'
      AND assets.deleted = FALSE
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own chat messages"
  ON asset_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON asset_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for asset_chat_message_reactions
CREATE POLICY "Reactions visible with messages"
  ON asset_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asset_chat_messages acm
      JOIN assets a ON a.id = acm.asset_id
      WHERE acm.id = asset_chat_message_reactions.message_id
      AND a.status = 'public'
      AND a.deleted = FALSE
    )
  );

CREATE POLICY "Authenticated users can react to messages"
  ON asset_chat_message_reactions FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for asset_chat_message_attachments
CREATE POLICY "Attachments visible with messages"
  ON asset_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asset_chat_messages acm
      JOIN assets a ON a.id = acm.asset_id
      WHERE acm.id = asset_chat_message_attachments.message_id
      AND a.status = 'public'
      AND a.deleted = FALSE
    )
  );

CREATE POLICY "Message authors can manage attachments"
  ON asset_chat_message_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM asset_chat_messages
      WHERE asset_chat_messages.id = message_id
      AND asset_chat_messages.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_downloads
CREATE POLICY "Users can view own asset downloads"
  ON asset_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage asset downloads"
  ON asset_downloads FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_asset_collaborators
  BEFORE UPDATE ON asset_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_licenses
  BEFORE UPDATE ON asset_licenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_chat_messages
  BEFORE UPDATE ON asset_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_chat_message_reactions
  BEFORE UPDATE ON asset_chat_message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_chat_message_attachments
  BEFORE UPDATE ON asset_chat_message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_downloads
  BEFORE UPDATE ON asset_downloads
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
