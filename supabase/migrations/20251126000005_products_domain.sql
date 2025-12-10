-- Products Domain
-- Products, variants, pricing, validation trigger, collaborators, reviews, and chat

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'public', 'archived')),
  view_count INTEGER NOT NULL DEFAULT 0,
  public_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.products IS 'Sellable products composed of variants and assets';

-- ============================================
-- 2. PRODUCT TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE (product_id, value)
);

COMMENT ON TABLE public.product_tags IS 'Tags for product categorization and search';

-- ============================================
-- 3. PRODUCT IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.product_images IS 'Product gallery images';

-- ============================================
-- 4. PRODUCT COLLABORATORS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  can_invite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(product_id, user_id)
);

COMMENT ON TABLE public.product_collaborators IS 'Users who can collaborate on product development';

-- ============================================
-- 5. PRODUCT REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  review_rating INTEGER NOT NULL CHECK (review_rating >= 1 AND review_rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);

COMMENT ON TABLE public.product_reviews IS 'Customer reviews for products';

-- ============================================
-- 6. PRODUCT CHAT SYSTEM
-- ============================================

-- Chat messages (restricted to contributors: owner + asset royalty recipients)
CREATE TABLE IF NOT EXISTS public.product_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.product_chat_messages IS 'Private chat for product contributors (owner + asset royalty recipients)';

-- Chat message reactions
CREATE TABLE IF NOT EXISTS public.product_chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.product_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id, emoji)
);

-- Chat message attachments
CREATE TABLE IF NOT EXISTS public.product_chat_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.product_chat_messages(id) ON DELETE CASCADE,
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
-- 7. INDEXES
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS products_handle_idx ON public.products(handle);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products(created_at DESC);

-- Product tags indexes
CREATE INDEX IF NOT EXISTS product_tags_product_id_idx ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS product_tags_value_idx ON public.product_tags(value);

-- Product images indexes
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_position_idx ON public.product_images(position);

-- Product collaborators indexes
CREATE INDEX IF NOT EXISTS product_collaborators_product_id_idx ON public.product_collaborators(product_id);
CREATE INDEX IF NOT EXISTS product_collaborators_user_id_idx ON public.product_collaborators(user_id);
CREATE INDEX IF NOT EXISTS product_collaborators_role_idx ON public.product_collaborators(role);

-- Product reviews indexes
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS product_reviews_rating_idx ON public.product_reviews(review_rating);
CREATE INDEX IF NOT EXISTS product_reviews_created_at_idx ON public.product_reviews(created_at DESC);

-- Product chat indexes
CREATE INDEX IF NOT EXISTS product_chat_messages_product_id_idx ON public.product_chat_messages(product_id);
CREATE INDEX IF NOT EXISTS product_chat_messages_user_id_idx ON public.product_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS product_chat_messages_created_at_idx ON public.product_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS product_chat_message_reactions_message_id_idx ON public.product_chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS product_chat_message_reactions_user_id_idx ON public.product_chat_message_reactions(user_id);
CREATE INDEX IF NOT EXISTS product_chat_message_attachments_message_id_idx ON public.product_chat_message_attachments(message_id);

-- ============================================
-- 8. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_images
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_collaborators
  BEFORE UPDATE ON public.product_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_reviews
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_chat_messages
  BEFORE UPDATE ON public.product_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_chat_message_reactions
  BEFORE UPDATE ON public.product_chat_message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_chat_message_attachments
  BEFORE UPDATE ON public.product_chat_message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_chat_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "public products are viewable by everyone"
  ON public.products FOR SELECT
  USING (status = 'public' AND deleted = FALSE);

CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_tags
CREATE POLICY "Product tags visible via product"
  ON public.product_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_tags.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own product tags"
  ON public.product_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_tags.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_images
CREATE POLICY "Product images visible via product"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage images"
  ON public.product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_collaborators
CREATE POLICY "Collaborators visible to product team"
  ON public.product_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_collaborators.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Product owners can manage collaborators"
  ON public.product_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_collaborators.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_reviews
CREATE POLICY "Reviews visible for public products"
  ON public.product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_reviews.product_id
      AND products.status = 'public'
      AND products.deleted = FALSE
      AND product_reviews.deleted = FALSE
    )
  );

CREATE POLICY "Users can create reviews for public products"
  ON public.product_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_id
      AND products.status = 'public'
      AND products.deleted = FALSE
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_chat_messages (restricted to product owners for now)
CREATE POLICY "Chat messages visible to product owners"
  ON public.product_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_chat_messages.product_id
      AND products.user_id = auth.uid()
      AND products.deleted = FALSE
    )
  );

COMMENT ON POLICY "Chat messages visible to product owners" ON public.product_chat_messages IS
  'Currently restricted to product owners';

CREATE POLICY "Product owners can post chat messages"
  ON public.product_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_id
      AND products.user_id = auth.uid()
      AND products.deleted = FALSE
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own chat messages"
  ON public.product_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.product_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_chat_message_reactions
CREATE POLICY "Reactions visible to product owners"
  ON public.product_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_chat_messages pcm
      JOIN public.products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_reactions.message_id
      AND p.user_id = auth.uid()
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can react to messages"
  ON public.product_chat_message_reactions FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.product_chat_messages pcm
      JOIN public.products p ON p.id = pcm.product_id
      WHERE pcm.id = message_id
      AND p.user_id = auth.uid()
      AND p.deleted = FALSE
    )
  );

-- RLS Policies for product_chat_message_attachments
CREATE POLICY "Attachments visible to product owners"
  ON public.product_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_chat_messages pcm
      JOIN public.products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_attachments.message_id
      AND p.user_id = auth.uid()
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Message authors can manage attachments"
  ON public.product_chat_message_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_chat_messages
      WHERE product_chat_messages.id = message_id
      AND product_chat_messages.user_id = auth.uid()
    )
  );
