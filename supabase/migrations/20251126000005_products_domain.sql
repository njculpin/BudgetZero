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
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.products IS 'Sellable products composed of variants and assets';

-- ============================================
-- 2. PRODUCT VARIANTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_digital BOOLEAN NOT NULL DEFAULT TRUE,
  options JSONB DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.product_variants IS 'Product variants (SKUs) with different options and pricing';

-- ============================================
-- 3. PRODUCT VARIANT PRICES
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_variant_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'usd',
  unit_amount INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, min_quantity)
);

COMMENT ON TABLE public.product_variant_prices IS 'Tiered pricing for product variants based on quantity';

-- ============================================
-- 4. PRODUCT PRICE BREAKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_price_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id UUID NOT NULL REFERENCES public.product_variant_prices(id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.product_price_breaks IS 'Quantity-based pricing breaks for bulk purchases';

-- ============================================
-- 5. PRODUCT ASSETS (LINKS VARIANTS TO ASSETS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, asset_id)
);

COMMENT ON TABLE public.product_assets IS 'Links product variants to downloadable assets';

-- ============================================
-- 6. PRODUCT TAGS
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
-- 7. PRODUCT IMAGES
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
-- 8. PRODUCT VARIANT IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.product_variant_images IS 'Variant-specific images';

-- ============================================
-- 9. PRODUCT COLLABORATORS
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
-- 10. PRODUCT REVIEWS
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
-- 11. PRODUCT CHAT SYSTEM
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
-- 12. INDEXES
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS products_handle_idx ON public.products(handle);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products(created_at DESC);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON public.product_variants(sku);

-- Product variant prices indexes
CREATE INDEX IF NOT EXISTS product_variant_prices_variant_id_idx ON public.product_variant_prices(variant_id);

-- Product price breaks indexes
CREATE INDEX IF NOT EXISTS product_price_breaks_price_id_idx ON public.product_price_breaks(price_id);
CREATE INDEX IF NOT EXISTS product_price_breaks_min_quantity_idx ON public.product_price_breaks(min_quantity);

-- Product assets indexes
CREATE INDEX IF NOT EXISTS product_assets_variant_id_idx ON public.product_assets(variant_id);
CREATE INDEX IF NOT EXISTS product_assets_asset_id_idx ON public.product_assets(asset_id);

-- Product tags indexes
CREATE INDEX IF NOT EXISTS product_tags_product_id_idx ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS product_tags_value_idx ON public.product_tags(value);

-- Product images indexes
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_position_idx ON public.product_images(position);

-- Product variant images indexes
CREATE INDEX IF NOT EXISTS product_variant_images_variant_id_idx ON public.product_variant_images(variant_id);
CREATE INDEX IF NOT EXISTS product_variant_images_product_id_idx ON public.product_variant_images(product_id);
CREATE INDEX IF NOT EXISTS product_variant_images_position_idx ON public.product_variant_images(position);

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
-- 13. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_variants
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_variant_prices
  BEFORE UPDATE ON public.product_variant_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_price_breaks
  BEFORE UPDATE ON public.product_price_breaks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_images
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_variant_images
  BEFORE UPDATE ON public.product_variant_images
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
-- 14. VALIDATION TRIGGER FOR ASSET STATUS
-- ============================================

-- Function to validate product publish based on asset status
-- Products can only be published if assets are 'private' OR 'public' (not draft/archived)
CREATE OR REPLACE FUNCTION validate_product_asset_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate when status is changing to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Check if product has any assets that are NOT private or public
    IF EXISTS (
      SELECT 1
      FROM public.product_assets pa
      JOIN public.product_variants pv ON pv.id = pa.variant_id
      JOIN public.assets a ON a.id = pa.asset_id
      WHERE pv.product_id = NEW.id
        AND a.status NOT IN ('private', 'public')
        AND a.deleted = false
        AND pv.deleted = false
    ) THEN
      RAISE EXCEPTION 'Cannot publish product: one or more linked assets are not ready. Assets must have status = ''private'' or ''public'' (not draft or archived) before publishing the product.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_product_asset_status() IS
  'Validates that a product can only be published if all linked assets have status = ''private'' or ''public''. This ensures customers cannot purchase products with draft or archived assets. Private assets are exclusive to the owner, while public assets can be used in other users'' products.';

-- Create trigger on products table
CREATE TRIGGER validate_product_asset_status_trigger
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_asset_status();

-- ============================================
-- 15. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_chat_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Published products are viewable by everyone"
  ON public.products FOR SELECT
  USING (status = 'published' AND deleted = FALSE);

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

-- RLS Policies for product_variants
CREATE POLICY "Product variants visible via product"
  ON public.product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variants.product_id
      AND (products.status = 'published' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own product variants"
  ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_variant_prices
CREATE POLICY "Prices visible via variant"
  ON public.product_variant_prices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = product_variant_prices.variant_id
      AND (p.status = 'published' OR p.user_id = auth.uid())
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own variant prices"
  ON public.product_variant_prices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = product_variant_prices.variant_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_price_breaks
CREATE POLICY "Price breaks visible via variant"
  ON public.product_price_breaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variant_prices pvp
      JOIN public.product_variants pv ON pv.id = pvp.variant_id
      JOIN public.products p ON p.id = pv.product_id
      WHERE pvp.id = product_price_breaks.price_id
      AND (p.status = 'published' OR p.user_id = auth.uid())
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage price breaks"
  ON public.product_price_breaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variant_prices pvp
      JOIN public.product_variants pv ON pv.id = pvp.variant_id
      JOIN public.products p ON p.id = pv.product_id
      WHERE pvp.id = product_price_breaks.price_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_assets
CREATE POLICY "Product assets visible via variant"
  ON public.product_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = product_assets.variant_id
      AND (p.status = 'published' OR p.user_id = auth.uid())
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own product assets"
  ON public.product_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = product_assets.variant_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_tags
CREATE POLICY "Product tags visible via product"
  ON public.product_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_tags.product_id
      AND (products.status = 'published' OR products.user_id = auth.uid())
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
      AND (products.status = 'published' OR products.user_id = auth.uid())
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

-- RLS Policies for product_variant_images
CREATE POLICY "Variant images visible via product"
  ON public.product_variant_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variant_images.product_id
      AND (products.status = 'published' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage variant images"
  ON public.product_variant_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variant_images.product_id
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
CREATE POLICY "Reviews visible for published products"
  ON public.product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_reviews.product_id
      AND products.status = 'published'
      AND products.deleted = FALSE
      AND product_reviews.deleted = FALSE
    )
  );

CREATE POLICY "Users can create reviews for published products"
  ON public.product_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_id
      AND products.status = 'published'
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

-- RLS Policies for product_chat_messages (restricted to contributors: owner + asset royalty recipients)
CREATE POLICY "Chat messages visible to contributors only"
  ON public.product_chat_messages FOR SELECT
  USING (
    -- User is the product owner
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_chat_messages.product_id
      AND products.user_id = auth.uid()
      AND products.deleted = FALSE
    )
    OR
    -- User has royalties on assets linked to this product's variants
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.product_variants pv ON pv.product_id = p.id
      JOIN public.product_assets pa ON pa.variant_id = pv.id
      JOIN public.asset_royalties ar ON ar.asset_id = pa.asset_id
      WHERE p.id = product_chat_messages.product_id
      AND ar.user_id = auth.uid()
      AND ar.deleted = FALSE
      AND pv.deleted = FALSE
      AND p.deleted = FALSE
    )
  );

COMMENT ON POLICY "Chat messages visible to contributors only" ON public.product_chat_messages IS
  'Contributors are product owners or users who have royalties on assets linked to the product''s variants';

CREATE POLICY "Contributors can post chat messages"
  ON public.product_chat_messages FOR INSERT
  WITH CHECK (
    -- User is the product owner
    (
      EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_id
        AND products.user_id = auth.uid()
        AND products.deleted = FALSE
      )
      OR
      -- User has royalties on assets linked to this product's variants
      EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.product_variants pv ON pv.product_id = p.id
        JOIN public.product_assets pa ON pa.variant_id = pv.id
        JOIN public.asset_royalties ar ON ar.asset_id = pa.asset_id
        WHERE p.id = product_id
        AND ar.user_id = auth.uid()
        AND ar.deleted = FALSE
        AND pv.deleted = FALSE
        AND p.deleted = FALSE
      )
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
CREATE POLICY "Reactions visible to contributors"
  ON public.product_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_chat_messages pcm
      JOIN public.products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_reactions.message_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.product_variants pv
          JOIN public.product_assets pa ON pa.variant_id = pv.id
          JOIN public.asset_royalties ar ON ar.asset_id = pa.asset_id
          WHERE pv.product_id = p.id
          AND ar.user_id = auth.uid()
          AND ar.deleted = FALSE
          AND pv.deleted = FALSE
        )
      )
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Contributors can react to messages"
  ON public.product_chat_message_reactions FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.product_chat_messages pcm
        JOIN public.products p ON p.id = pcm.product_id
        WHERE pcm.id = message_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.product_variants pv
            JOIN public.product_assets pa ON pa.variant_id = pv.id
            JOIN public.asset_royalties ar ON ar.asset_id = pa.asset_id
            WHERE pv.product_id = p.id
            AND ar.user_id = auth.uid()
            AND ar.deleted = FALSE
            AND pv.deleted = FALSE
          )
        )
        AND p.deleted = FALSE
      )
    )
  );

-- RLS Policies for product_chat_message_attachments
CREATE POLICY "Attachments visible to contributors"
  ON public.product_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_chat_messages pcm
      JOIN public.products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_attachments.message_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.product_variants pv
          JOIN public.product_assets pa ON pa.variant_id = pv.id
          JOIN public.asset_royalties ar ON ar.asset_id = pa.asset_id
          WHERE pv.product_id = p.id
          AND ar.user_id = auth.uid()
          AND ar.deleted = FALSE
          AND pv.deleted = FALSE
        )
      )
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
