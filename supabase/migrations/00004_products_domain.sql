-- Products Domain
-- Products with files, documents, components, royalties, collaborators, and reviews

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'private', 'public', 'archived')),
  product_type TEXT DEFAULT 'digital' NOT NULL CHECK (product_type IN ('digital', 'print_service', 'paint_service')),
  is_embeddable BOOLEAN NOT NULL DEFAULT false,
  needs_attention BOOLEAN NOT NULL DEFAULT FALSE,
  attention_reason TEXT,
  attention_since TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  public_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.products IS 'Sellable products with embedded components and royalties';
COMMENT ON COLUMN public.products.status IS 'Product visibility: draft, private (share link only), public (marketplace), archived';
COMMENT ON COLUMN public.products.product_type IS 'Type of product: digital (files/documents), print_service (3D printing), paint_service (miniature painting)';
COMMENT ON COLUMN public.products.is_embeddable IS 'Whether this product can be embedded as a component in other products';
COMMENT ON COLUMN public.products.needs_attention IS 'True when product requires owner review due to embedded product changes';
COMMENT ON COLUMN public.products.attention_reason IS 'Explanation of why product needs attention (e.g., embedded product price increased)';
COMMENT ON COLUMN public.products.attention_since IS 'Timestamp when product was flagged for attention';

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
-- 4. PRODUCT FILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.product_files IS 'Downloadable files attached to products';
COMMENT ON COLUMN public.product_files.price_cents IS 'Price for this file when product is purchased';

-- ============================================
-- 5. PRODUCT DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  pdf_url TEXT,
  pdf_storage_path TEXT,
  pdf_generated_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.product_documents IS 'Documents attached to products with pricing and auto-generated PDFs';
COMMENT ON COLUMN public.product_documents.price_cents IS 'Price for this document when product is purchased';
COMMENT ON COLUMN public.product_documents.pdf_url IS 'URL of auto-generated PDF from document';
COMMENT ON COLUMN public.product_documents.pdf_storage_path IS 'Storage path for the PDF file';
COMMENT ON COLUMN public.product_documents.pdf_generated_at IS 'Timestamp when PDF was last generated';

-- ============================================
-- 6. PRODUCT COMPONENTS (Product-in-Product)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  child_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  inherited_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT prevent_self_embedding CHECK (parent_product_id != child_product_id)
);

COMMENT ON TABLE public.product_components IS 'Product-in-product embedding for collaborative products';
COMMENT ON COLUMN public.product_components.parent_product_id IS 'The product that embeds another product';
COMMENT ON COLUMN public.product_components.child_product_id IS 'The product being embedded';
COMMENT ON COLUMN public.product_components.inherited_price_cents IS 'Price inherited from the embedded product at link time';

-- ============================================
-- 7. PRODUCT ROYALTIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value INTEGER NOT NULL CHECK (royalty_value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.product_royalties IS 'Royalty splits for product contributors';
COMMENT ON COLUMN public.product_royalties.royalty_type IS 'fixed = cents, percentage = 0-100';
COMMENT ON COLUMN public.product_royalties.royalty_value IS 'For fixed: cents, for percentage: 0-100';

-- ============================================
-- 8. PRODUCT COLLABORATORS
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
-- 9. PRODUCT REVIEWS
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
-- 10. INDEXES
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS products_handle_idx ON public.products(handle);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS products_needs_attention_idx ON public.products(needs_attention, user_id) WHERE needs_attention = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_embeddable ON public.products(is_embeddable) WHERE NOT deleted;

-- Product tags indexes
CREATE INDEX IF NOT EXISTS product_tags_product_id_idx ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS product_tags_value_idx ON public.product_tags(value);

-- Product images indexes
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_position_idx ON public.product_images(position);

-- Product files indexes
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON public.product_files(product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_files_position ON public.product_files(position);

-- Product documents indexes
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON public.product_documents(product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_documents_document_id ON public.product_documents(document_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_documents_position ON public.product_documents(position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_documents_unique ON public.product_documents(product_id, document_id) WHERE deleted = false;

-- Product components indexes
CREATE INDEX IF NOT EXISTS idx_product_components_parent_product ON public.product_components(parent_product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_components_child_product ON public.product_components(child_product_id) WHERE deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_components_unique_embedding ON public.product_components(parent_product_id, child_product_id) WHERE deleted = false;

-- Product royalties indexes
CREATE INDEX IF NOT EXISTS idx_product_royalties_product_id ON public.product_royalties(product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_royalties_user_id ON public.product_royalties(user_id) WHERE deleted = false;

-- Product collaborators indexes
CREATE INDEX IF NOT EXISTS product_collaborators_product_id_idx ON public.product_collaborators(product_id);
CREATE INDEX IF NOT EXISTS product_collaborators_user_id_idx ON public.product_collaborators(user_id);
CREATE INDEX IF NOT EXISTS product_collaborators_role_idx ON public.product_collaborators(role);

-- Product reviews indexes
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS product_reviews_rating_idx ON public.product_reviews(review_rating);
CREATE INDEX IF NOT EXISTS product_reviews_created_at_idx ON public.product_reviews(created_at DESC);

-- ============================================
-- 11. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_images
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_files
  BEFORE UPDATE ON public.product_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_documents
  BEFORE UPDATE ON public.product_documents
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

CREATE TRIGGER set_updated_at_product_royalties
  BEFORE UPDATE ON public.product_royalties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 12. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Public products are viewable by everyone"
  ON public.products FOR SELECT
  USING (status = 'public' AND deleted = FALSE);

CREATE POLICY "Product owners can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Product collaborators can view products"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_collaborators
      WHERE product_collaborators.product_id = products.id
      AND product_collaborators.user_id = auth.uid()
      AND product_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Product owners can update products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Editors can update products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_collaborators
      WHERE product_collaborators.product_id = products.id
      AND product_collaborators.user_id = auth.uid()
      AND product_collaborators.can_edit = TRUE
      AND product_collaborators.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can delete products"
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

CREATE POLICY "Product owners can manage tags"
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

-- RLS Policies for product_files
CREATE POLICY "Product files visible via product"
  ON public.product_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_files.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage files"
  ON public.product_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_files.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_documents
CREATE POLICY "Product documents visible via product"
  ON public.product_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_documents.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage documents"
  ON public.product_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_documents.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_components
CREATE POLICY "Users can view components for products they can view"
  ON public.product_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_components.parent_product_id
        AND (products.status = 'public' OR products.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert components for their own products"
  ON public.product_components FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_components.parent_product_id
        AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update components for their own products"
  ON public.product_components FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_components.parent_product_id
        AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete components for their own products"
  ON public.product_components FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_components.parent_product_id
        AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_royalties
CREATE POLICY "Product royalties visible via product"
  ON public.product_royalties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_royalties.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage royalties"
  ON public.product_royalties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_royalties.product_id
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

CREATE POLICY "Inviters can manage collaborators"
  ON public.product_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_collaborators pc
      WHERE pc.product_id = product_id
      AND pc.user_id = auth.uid()
      AND pc.can_invite = TRUE
      AND pc.deleted = FALSE
    )
  );

-- RLS Policies for product_reviews
CREATE POLICY "Product reviews are publicly viewable"
  ON public.product_reviews FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can create reviews for products"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviewers can update own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can delete own reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id);
