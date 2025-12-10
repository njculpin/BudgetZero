-- Migration: Product-Level Embedding
-- Date: 2025-12-09
-- Description: Create product_components and product_files tables

-- Step 1: Create product_files table (replaces asset files)
CREATE TABLE IF NOT EXISTS product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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

COMMENT ON TABLE product_files IS 'Downloadable files attached to products';

-- Enable RLS on product_files
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_files
CREATE POLICY "Product files visible via product"
  ON product_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_files.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage files"
  ON product_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_files.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create indexes for product_files
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON product_files(product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_files_position ON product_files(position);

-- Create trigger for product_files
CREATE TRIGGER set_updated_at_product_files
  BEFORE UPDATE ON product_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 2: Create product_components table
CREATE TABLE IF NOT EXISTS product_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  child_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inherited_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_components IS 'Product-in-product embedding for collaborative products';

-- Step 3: Enable RLS
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view components for products they can view"
  ON product_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.parent_product_id
        AND (products.status = 'public' OR products.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert components for their own products"
  ON product_components FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.parent_product_id
        AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update components for their own products"
  ON product_components FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.parent_product_id
        AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete components for their own products"
  ON product_components FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.parent_product_id
        AND products.user_id = auth.uid()
    )
  );

-- Step 5: Add helpful comments
COMMENT ON COLUMN product_components.parent_product_id IS 'The product that embeds another product';
COMMENT ON COLUMN product_components.inherited_price_cents IS 'Price inherited from the embedded product at link time';

-- Step 6: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_components_parent_product
  ON product_components(parent_product_id)
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_product_components_child_product
  ON product_components(child_product_id)
  WHERE deleted = false;

-- Step 7: Add constraints
ALTER TABLE product_components
  ADD CONSTRAINT prevent_self_embedding
  CHECK (parent_product_id != child_product_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_components_unique_embedding
  ON product_components(parent_product_id, child_product_id)
  WHERE deleted = false;

-- Step 8: Create product_royalties table
CREATE TABLE IF NOT EXISTS product_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value INTEGER NOT NULL CHECK (royalty_value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_royalties IS 'Royalty splits for product contributors';
COMMENT ON COLUMN product_royalties.royalty_type IS 'fixed = cents, percentage = 0-100';
COMMENT ON COLUMN product_royalties.royalty_value IS 'For fixed: cents, for percentage: 0-100';

-- Enable RLS on product_royalties
ALTER TABLE product_royalties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_royalties
CREATE POLICY "Product royalties visible via product"
  ON product_royalties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_royalties.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage royalties"
  ON product_royalties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_royalties.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create indexes for product_royalties
CREATE INDEX IF NOT EXISTS idx_product_royalties_product_id ON product_royalties(product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_royalties_user_id ON product_royalties(user_id) WHERE deleted = false;

-- Create trigger for product_royalties
CREATE TRIGGER set_updated_at_product_royalties
  BEFORE UPDATE ON product_royalties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
