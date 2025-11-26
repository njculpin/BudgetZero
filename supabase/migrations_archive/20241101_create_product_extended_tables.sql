-- Create extended product-related tables
-- Includes: images, collaborators, reviews, variant images, price breaks, and chat system

-- ============================================
-- PRODUCT IMAGES
-- ============================================

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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

-- ============================================
-- PRODUCT COLLABORATORS
-- ============================================

-- Create product_collaborators table
CREATE TABLE IF NOT EXISTS product_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================
-- PRODUCT VARIANT IMAGES
-- ============================================

-- Create product_variant_images table
CREATE TABLE IF NOT EXISTS product_variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
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

-- ============================================
-- PRODUCT PRICE BREAKS
-- ============================================

-- Create product_price_breaks table (quantity-based pricing)
CREATE TABLE IF NOT EXISTS product_price_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id UUID NOT NULL REFERENCES product_variant_prices(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),
  max_quantity INTEGER CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  CHECK (max_quantity IS NULL OR max_quantity > min_quantity)
);

-- ============================================
-- PRODUCT REVIEWS
-- ============================================

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  review_rating INTEGER NOT NULL CHECK (review_rating >= 1 AND review_rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);

-- ============================================
-- PRODUCT CHAT SYSTEM
-- ============================================

-- Create product_chat_messages table
CREATE TABLE IF NOT EXISTS product_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create product_chat_message_reactions table
CREATE TABLE IF NOT EXISTS product_chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES product_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id, emoji)
);

-- Create product_chat_message_attachments table
CREATE TABLE IF NOT EXISTS product_chat_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES product_chat_messages(id) ON DELETE CASCADE,
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
-- INDEXES
-- ============================================

-- Indexes for product_images
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_position_idx ON product_images(position);

-- Indexes for product_collaborators
CREATE INDEX IF NOT EXISTS product_collaborators_product_id_idx ON product_collaborators(product_id);
CREATE INDEX IF NOT EXISTS product_collaborators_user_id_idx ON product_collaborators(user_id);
CREATE INDEX IF NOT EXISTS product_collaborators_role_idx ON product_collaborators(role);

-- Indexes for product_variant_images
CREATE INDEX IF NOT EXISTS product_variant_images_variant_id_idx ON product_variant_images(variant_id);
CREATE INDEX IF NOT EXISTS product_variant_images_product_id_idx ON product_variant_images(product_id);
CREATE INDEX IF NOT EXISTS product_variant_images_position_idx ON product_variant_images(position);

-- Indexes for product_price_breaks
CREATE INDEX IF NOT EXISTS product_price_breaks_price_id_idx ON product_price_breaks(price_id);
CREATE INDEX IF NOT EXISTS product_price_breaks_min_quantity_idx ON product_price_breaks(min_quantity);

-- Indexes for product_reviews
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS product_reviews_rating_idx ON product_reviews(review_rating);
CREATE INDEX IF NOT EXISTS product_reviews_created_at_idx ON product_reviews(created_at DESC);

-- Indexes for product_chat_messages
CREATE INDEX IF NOT EXISTS product_chat_messages_product_id_idx ON product_chat_messages(product_id);
CREATE INDEX IF NOT EXISTS product_chat_messages_user_id_idx ON product_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS product_chat_messages_created_at_idx ON product_chat_messages(created_at DESC);

-- Indexes for product_chat_message_reactions
CREATE INDEX IF NOT EXISTS product_chat_message_reactions_message_id_idx ON product_chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS product_chat_message_reactions_user_id_idx ON product_chat_message_reactions(user_id);

-- Indexes for product_chat_message_attachments
CREATE INDEX IF NOT EXISTS product_chat_message_attachments_message_id_idx ON product_chat_message_attachments(message_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_chat_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_images
CREATE POLICY "Product images visible via product"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
      AND (products.status = 'published' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage images"
  ON product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_collaborators
CREATE POLICY "Collaborators visible to product team"
  ON product_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_collaborators.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Product owners can manage collaborators"
  ON product_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_collaborators.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_variant_images
CREATE POLICY "Variant images visible via product"
  ON product_variant_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variant_images.product_id
      AND (products.status = 'published' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage variant images"
  ON product_variant_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variant_images.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_price_breaks
CREATE POLICY "Price breaks visible via variant"
  ON product_price_breaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_variant_prices pvp
      JOIN product_variants pv ON pv.id = pvp.variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE pvp.id = product_price_breaks.price_id
      AND (p.status = 'published' OR p.user_id = auth.uid())
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage price breaks"
  ON product_price_breaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM product_variant_prices pvp
      JOIN product_variants pv ON pv.id = pvp.variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE pvp.id = product_price_breaks.price_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_reviews
CREATE POLICY "Reviews visible for published products"
  ON product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_reviews.product_id
      AND products.status = 'published'
      AND products.deleted = FALSE
      AND product_reviews.deleted = FALSE
    )
  );

CREATE POLICY "Users can create reviews for published products"
  ON product_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
      AND products.status = 'published'
      AND products.deleted = FALSE
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_chat_messages
CREATE POLICY "Chat messages visible for published products"
  ON product_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_chat_messages.product_id
      AND products.status = 'published'
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Authenticated users can post chat messages"
  ON product_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
      AND products.status = 'published'
      AND products.deleted = FALSE
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own chat messages"
  ON product_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON product_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_chat_message_reactions
CREATE POLICY "Reactions visible with messages"
  ON product_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_chat_messages pcm
      JOIN products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_reactions.message_id
      AND p.status = 'published'
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Authenticated users can react to messages"
  ON product_chat_message_reactions FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for product_chat_message_attachments
CREATE POLICY "Attachments visible with messages"
  ON product_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_chat_messages pcm
      JOIN products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_attachments.message_id
      AND p.status = 'published'
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Message authors can manage attachments"
  ON product_chat_message_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM product_chat_messages
      WHERE product_chat_messages.id = message_id
      AND product_chat_messages.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_product_images
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_collaborators
  BEFORE UPDATE ON product_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_variant_images
  BEFORE UPDATE ON product_variant_images
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_price_breaks
  BEFORE UPDATE ON product_price_breaks
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_reviews
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_chat_messages
  BEFORE UPDATE ON product_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_chat_message_reactions
  BEFORE UPDATE ON product_chat_message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_chat_message_attachments
  BEFORE UPDATE ON product_chat_message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
