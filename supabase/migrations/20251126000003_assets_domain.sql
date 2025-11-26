-- Assets Domain
-- Assets with 4-state lifecycle (draft, private, public, archived), files, images, royalties, licenses, collaborators, and chat

-- ============================================
-- 1. ASSETS TABLE (4-STATE SYSTEM)
-- ============================================

CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'private', 'public', 'archived')),
    download_count INTEGER DEFAULT 0 NOT NULL,
    total_size_bytes BIGINT DEFAULT 0 NOT NULL,
    file_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.assets IS 'Digital assets with 4-state lifecycle: draft (work in progress), private (ready but exclusive), public (ready and reusable), archived (deprecated)';
COMMENT ON COLUMN public.assets.status IS 'Asset lifecycle state: draft (work in progress), private (ready but exclusive to owner), public (ready and can be used by others), archived (deprecated)';

-- ============================================
-- 2. ASSET FILES AND IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.asset_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.asset_files IS 'Downloadable files attached to assets (PDFs, STLs, OBJs, etc.)';

CREATE TABLE IF NOT EXISTS public.asset_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.asset_images IS 'Preview images and screenshots for assets';

-- ============================================
-- 3. ASSET TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.asset_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT asset_tags_value_length CHECK (char_length(value) <= 50)
);

COMMENT ON TABLE public.asset_tags IS 'Tags/keywords for categorizing and searching assets';
COMMENT ON COLUMN public.asset_tags.value IS 'Tag value, max 50 characters, used for categorization';

-- ============================================
-- 4. ASSET ROYALTIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.asset_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value NUMERIC NOT NULL CHECK (royalty_value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.asset_royalties IS 'Royalty splits for asset contributors (fixed dollar amounts or percentages)';

-- ============================================
-- 5. ASSET COLLABORATORS
-- ============================================

CREATE TABLE IF NOT EXISTS public.asset_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(asset_id, user_id)
);

COMMENT ON TABLE public.asset_collaborators IS 'Users who can access private asset chat and collaborate on asset development';

-- ============================================
-- 6. ASSET LICENSES
-- ============================================

CREATE TABLE IF NOT EXISTS public.asset_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  license_id UUID NOT NULL, -- References licenses table in system domain
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.asset_licenses IS 'License agreements attached to assets for usage rights';

-- ============================================
-- 7. ASSET CHAT SYSTEM
-- ============================================

-- Chat messages (restricted to collaborators only)
CREATE TABLE IF NOT EXISTS public.asset_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.asset_chat_messages IS 'Private chat for asset collaborators';

-- Chat message reactions
CREATE TABLE IF NOT EXISTS public.asset_chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.asset_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id, emoji)
);

-- Chat message attachments
CREATE TABLE IF NOT EXISTS public.asset_chat_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.asset_chat_messages(id) ON DELETE CASCADE,
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
-- 8. ASSET DOWNLOADS
-- ============================================

CREATE TABLE IF NOT EXISTS public.asset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL, -- References sales table in commerce domain
  download_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.asset_downloads IS 'Temporary download links for purchased assets';

-- ============================================
-- 9. INDEXES
-- ============================================

-- Assets indexes
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS assets_handle_idx ON public.assets(handle);
CREATE INDEX IF NOT EXISTS assets_status_idx ON public.assets(status);

-- Asset files indexes
CREATE INDEX IF NOT EXISTS asset_files_asset_id_idx ON public.asset_files(asset_id);
CREATE INDEX IF NOT EXISTS asset_files_asset_id_position_idx ON public.asset_files(asset_id, position);

-- Asset images indexes
CREATE INDEX IF NOT EXISTS asset_images_asset_id_idx ON public.asset_images(asset_id);
CREATE INDEX IF NOT EXISTS asset_images_asset_id_position_idx ON public.asset_images(asset_id, position);

-- Asset tags indexes
CREATE INDEX IF NOT EXISTS asset_tags_asset_id_idx ON public.asset_tags(asset_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS asset_tags_value_idx ON public.asset_tags(value) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS asset_tags_asset_value_idx ON public.asset_tags(asset_id, value) WHERE deleted = false;

-- Asset royalties indexes
CREATE INDEX IF NOT EXISTS asset_royalties_asset_id_idx ON public.asset_royalties(asset_id);
CREATE INDEX IF NOT EXISTS asset_royalties_user_id_idx ON public.asset_royalties(user_id);

-- Asset collaborators indexes
CREATE INDEX IF NOT EXISTS asset_collaborators_asset_id_idx ON public.asset_collaborators(asset_id);
CREATE INDEX IF NOT EXISTS asset_collaborators_user_id_idx ON public.asset_collaborators(user_id);

-- Asset licenses indexes
CREATE INDEX IF NOT EXISTS asset_licenses_asset_id_idx ON public.asset_licenses(asset_id);
CREATE INDEX IF NOT EXISTS asset_licenses_license_id_idx ON public.asset_licenses(license_id);
CREATE INDEX IF NOT EXISTS asset_licenses_is_active_idx ON public.asset_licenses(is_active);
CREATE INDEX IF NOT EXISTS asset_licenses_expires_at_idx ON public.asset_licenses(expires_at);

-- Asset chat indexes
CREATE INDEX IF NOT EXISTS asset_chat_messages_asset_id_idx ON public.asset_chat_messages(asset_id);
CREATE INDEX IF NOT EXISTS asset_chat_messages_user_id_idx ON public.asset_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS asset_chat_messages_created_at_idx ON public.asset_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS asset_chat_message_reactions_message_id_idx ON public.asset_chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS asset_chat_message_reactions_user_id_idx ON public.asset_chat_message_reactions(user_id);
CREATE INDEX IF NOT EXISTS asset_chat_message_attachments_message_id_idx ON public.asset_chat_message_attachments(message_id);

-- Asset downloads indexes
CREATE INDEX IF NOT EXISTS asset_downloads_asset_id_idx ON public.asset_downloads(asset_id);
CREATE INDEX IF NOT EXISTS asset_downloads_user_id_idx ON public.asset_downloads(user_id);
CREATE INDEX IF NOT EXISTS asset_downloads_sale_id_idx ON public.asset_downloads(sale_id);
CREATE INDEX IF NOT EXISTS asset_downloads_expires_at_idx ON public.asset_downloads(expires_at);

-- ============================================
-- 10. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_assets
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_files
    BEFORE UPDATE ON public.asset_files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_images
    BEFORE UPDATE ON public.asset_images
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_tags
    BEFORE UPDATE ON public.asset_tags
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_royalties
  BEFORE UPDATE ON public.asset_royalties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_licenses
  BEFORE UPDATE ON public.asset_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_chat_messages
  BEFORE UPDATE ON public.asset_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_chat_message_reactions
  BEFORE UPDATE ON public.asset_chat_message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_chat_message_attachments
  BEFORE UPDATE ON public.asset_chat_message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_downloads
  BEFORE UPDATE ON public.asset_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets
CREATE POLICY "Public assets are viewable by everyone"
    ON public.assets
    FOR SELECT
    USING (status = 'public' AND deleted = false);

CREATE POLICY "Users can view own assets"
    ON public.assets
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
    ON public.assets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
    ON public.assets
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
    ON public.assets
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for asset_files
CREATE POLICY "Asset files are viewable for public assets"
    ON public.asset_files
    FOR SELECT
    USING (
        deleted = false AND
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.status = 'public'
            AND assets.deleted = false
        )
    );

CREATE POLICY "Users can view own asset files"
    ON public.asset_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create files for own assets"
    ON public.asset_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own asset files"
    ON public.asset_files
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own asset files"
    ON public.asset_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- RLS Policies for asset_images (same pattern as asset_files)
CREATE POLICY "Asset images are viewable for public assets"
    ON public.asset_images
    FOR SELECT
    USING (
        deleted = false AND
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.status = 'public'
            AND assets.deleted = false
        )
    );

CREATE POLICY "Users can view own asset images"
    ON public.asset_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create images for own assets"
    ON public.asset_images
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own asset images"
    ON public.asset_images
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own asset images"
    ON public.asset_images
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- RLS Policies for asset_tags
CREATE POLICY "Tags for public assets are viewable by everyone"
    ON public.asset_tags FOR SELECT
    USING (
        deleted = false
        AND EXISTS (
            SELECT 1 FROM public.assets
            WHERE id = asset_tags.asset_id
            AND status = 'public'
            AND deleted = false
        )
    );

CREATE POLICY "Users can view tags for own assets"
    ON public.asset_tags FOR SELECT
    USING (
        deleted = false
        AND EXISTS (
            SELECT 1 FROM public.assets
            WHERE id = asset_tags.asset_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tags for own assets"
    ON public.asset_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE id = asset_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tags for own assets"
    ON public.asset_tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE id = asset_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tags for own assets"
    ON public.asset_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE id = asset_id
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for asset_royalties
CREATE POLICY "Asset royalties visible to asset owner and recipient"
  ON public.asset_royalties FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_royalties.asset_id
      AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Asset owners can manage royalties"
  ON public.asset_royalties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_royalties.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_collaborators
CREATE POLICY "Collaborators visible to asset team"
  ON public.asset_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_collaborators.asset_id
      AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Asset owners can manage collaborators"
  ON public.asset_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_collaborators.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_licenses
CREATE POLICY "Licenses visible for public assets"
  ON public.asset_licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_licenses.asset_id
      AND (assets.status = 'public' OR assets.user_id = auth.uid())
      AND assets.deleted = FALSE
    )
  );

CREATE POLICY "Asset owners can manage licenses"
  ON public.asset_licenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_licenses.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_chat_messages (restricted to collaborators only)
CREATE POLICY "Chat messages visible to collaborators only"
  ON public.asset_chat_messages FOR SELECT
  USING (
    -- User is a collaborator on this asset
    EXISTS (
      SELECT 1 FROM public.asset_collaborators
      WHERE asset_collaborators.asset_id = asset_chat_messages.asset_id
      AND asset_collaborators.user_id = auth.uid()
      AND asset_collaborators.deleted = FALSE
    )
    OR
    -- User is the asset owner
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_chat_messages.asset_id
      AND assets.user_id = auth.uid()
      AND assets.deleted = FALSE
    )
  );

CREATE POLICY "Collaborators can post chat messages"
  ON public.asset_chat_messages FOR INSERT
  WITH CHECK (
    -- User is a collaborator on this asset
    (
      EXISTS (
        SELECT 1 FROM public.asset_collaborators
        WHERE asset_collaborators.asset_id = asset_id
        AND asset_collaborators.user_id = auth.uid()
        AND asset_collaborators.deleted = FALSE
      )
      OR
      -- User is the asset owner
      EXISTS (
        SELECT 1 FROM public.assets
        WHERE assets.id = asset_id
        AND assets.user_id = auth.uid()
        AND assets.deleted = FALSE
      )
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own chat messages"
  ON public.asset_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.asset_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for asset_chat_message_reactions
CREATE POLICY "Reactions visible to collaborators"
  ON public.asset_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.asset_chat_messages acm
      JOIN public.asset_collaborators ac ON ac.asset_id = acm.asset_id
      WHERE acm.id = asset_chat_message_reactions.message_id
      AND ac.user_id = auth.uid()
      AND ac.deleted = FALSE
    )
    OR
    EXISTS (
      SELECT 1 FROM public.asset_chat_messages acm
      JOIN public.assets a ON a.id = acm.asset_id
      WHERE acm.id = asset_chat_message_reactions.message_id
      AND a.user_id = auth.uid()
      AND a.deleted = FALSE
    )
  );

CREATE POLICY "Collaborators can react to messages"
  ON public.asset_chat_message_reactions FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.asset_chat_messages acm
        JOIN public.asset_collaborators ac ON ac.asset_id = acm.asset_id
        WHERE acm.id = message_id
        AND ac.user_id = auth.uid()
        AND ac.deleted = FALSE
      )
      OR
      EXISTS (
        SELECT 1 FROM public.asset_chat_messages acm
        JOIN public.assets a ON a.id = acm.asset_id
        WHERE acm.id = message_id
        AND a.user_id = auth.uid()
        AND a.deleted = FALSE
      )
    )
  );

-- RLS Policies for asset_chat_message_attachments
CREATE POLICY "Attachments visible to collaborators"
  ON public.asset_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.asset_chat_messages acm
      JOIN public.asset_collaborators ac ON ac.asset_id = acm.asset_id
      WHERE acm.id = asset_chat_message_attachments.message_id
      AND ac.user_id = auth.uid()
      AND ac.deleted = FALSE
    )
    OR
    EXISTS (
      SELECT 1 FROM public.asset_chat_messages acm
      JOIN public.assets a ON a.id = acm.asset_id
      WHERE acm.id = asset_chat_message_attachments.message_id
      AND a.user_id = auth.uid()
      AND a.deleted = FALSE
    )
  );

CREATE POLICY "Message authors can manage attachments"
  ON public.asset_chat_message_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.asset_chat_messages
      WHERE asset_chat_messages.id = message_id
      AND asset_chat_messages.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_downloads
CREATE POLICY "Users can view own asset downloads"
  ON public.asset_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage asset downloads"
  ON public.asset_downloads FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
