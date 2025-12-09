-- Migration: Convert Assets to Products
-- This migration eliminates the separate Asset entity and moves all asset functionality into Products
-- Products can now be embedded into other products (product-in-product pattern)

-- Step 1: Add new columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_embeddable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS direct_sale_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS embedding_royalty_cents INTEGER,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_size_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0;

-- Step 2: Create new product_files table (replaces asset_files)
CREATE TABLE IF NOT EXISTS product_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON product_files(product_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_product_files_position ON product_files(product_id, position) WHERE deleted = FALSE;

-- Step 3: Create product_components table (replaces product_assets)
CREATE TABLE IF NOT EXISTS product_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_variant_id UUID REFERENCES product_variants(id) NOT NULL,
  child_product_id UUID REFERENCES products(id) NOT NULL,
  royalty_amount_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_components_parent ON product_components(parent_variant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_product_components_child ON product_components(child_product_id) WHERE deleted = FALSE;

-- Step 4: Create product_royalties table (replaces asset_royalties)
CREATE TABLE IF NOT EXISTS product_royalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_royalties_product_id ON product_royalties(product_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_product_royalties_user_id ON product_royalties(user_id) WHERE deleted = FALSE;

-- Step 5: Migrate data from assets to products
-- Note: This uses the same ID to preserve foreign key relationships
INSERT INTO products (
  id,
  handle,
  title,
  user_id,
  description,
  status,
  view_count,
  created_at,
  updated_at,
  deleted,
  deleted_at,
  is_embeddable,
  download_count,
  total_size_bytes,
  file_count,
  public_at,
  needs_attention,
  attention_reason,
  attention_since
)
SELECT
  id,
  handle,
  title,
  user_id,
  description,
  status,
  0 as view_count,
  created_at,
  updated_at,
  deleted,
  deleted_at,
  TRUE as is_embeddable,
  download_count,
  total_size_bytes,
  file_count,
  NULL as public_at,
  FALSE as needs_attention,
  NULL as attention_reason,
  NULL as attention_since
FROM assets
WHERE id NOT IN (SELECT id FROM products)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Migrate asset_files to product_files
INSERT INTO product_files (
  id,
  product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT
  id,
  asset_id as product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
FROM asset_files
ON CONFLICT (id) DO NOTHING;

-- Step 7: Migrate asset_images to product_images (avoiding duplicates)
INSERT INTO product_images (
  id,
  product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT
  id,
  asset_id as product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
FROM asset_images
WHERE id NOT IN (SELECT id FROM product_images)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Migrate asset_royalties to product_royalties
INSERT INTO product_royalties (
  id,
  product_id,
  user_id,
  royalty_type,
  royalty_value,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT
  id,
  asset_id as product_id,
  user_id,
  royalty_type,
  royalty_value,
  created_at,
  updated_at,
  deleted,
  deleted_at
FROM asset_royalties
ON CONFLICT (id) DO NOTHING;

-- Step 9: Convert product_assets to product_components
-- Calculate total royalty for each asset and capture it at component link time
INSERT INTO product_components (
  parent_variant_id,
  child_product_id,
  royalty_amount_cents,
  created_at
)
SELECT
  pa.variant_id as parent_variant_id,
  pa.asset_id as child_product_id,
  COALESCE(
    (SELECT SUM(royalty_value)
     FROM asset_royalties
     WHERE asset_id = pa.asset_id
       AND deleted = FALSE
       AND royalty_type = 'fixed'),
    0
  ) as royalty_amount_cents,
  pa.created_at
FROM product_assets pa;

-- Step 10: Merge asset_collaborators into product_collaborators (avoid duplicates)
INSERT INTO product_collaborators (
  product_id,
  user_id,
  role,
  can_edit,
  can_delete,
  can_invite,
  created_at
)
SELECT DISTINCT ON (ac.asset_id, ac.user_id)
  ac.asset_id as product_id,
  ac.user_id,
  'editor' as role,
  TRUE as can_edit,
  FALSE as can_delete,
  FALSE as can_invite,
  ac.created_at
FROM asset_collaborators ac
WHERE NOT EXISTS (
  SELECT 1 FROM product_collaborators pc
  WHERE pc.product_id = ac.asset_id AND pc.user_id = ac.user_id
);

-- Step 11: Merge asset_tags into product_tags (avoid duplicates)
INSERT INTO product_tags (
  product_id,
  value,
  created_at,
  deleted,
  deleted_at
)
SELECT DISTINCT ON (at.asset_id, at.value)
  at.asset_id as product_id,
  at.value,
  at.created_at,
  at.deleted,
  at.deleted_at
FROM asset_tags at
WHERE NOT EXISTS (
  SELECT 1 FROM product_tags pt
  WHERE pt.product_id = at.asset_id AND pt.value = at.value
)
ON CONFLICT DO NOTHING;

-- Step 12: Update RLS policies for new tables

-- Enable RLS
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_royalties ENABLE ROW LEVEL SECURITY;

-- Product Files policies (similar to asset_files)
CREATE POLICY "Users can view files for products they can view"
  ON product_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_files.product_id
        AND (
          p.status = 'public'
          OR p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM product_collaborators pc
            WHERE pc.product_id = p.id AND pc.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can insert files for their own products"
  ON product_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_files.product_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files for their own products"
  ON product_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_files.product_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for their own products"
  ON product_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_files.product_id AND p.user_id = auth.uid()
    )
  );

-- Product Components policies
CREATE POLICY "Users can view components for products they can view"
  ON product_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_components.parent_variant_id
        AND (
          p.status = 'public'
          OR p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM product_collaborators pc
            WHERE pc.product_id = p.id AND pc.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can insert components for their own products"
  ON product_components FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_components.parent_variant_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update components for their own products"
  ON product_components FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_components.parent_variant_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete components for their own products"
  ON product_components FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_components.parent_variant_id
        AND p.user_id = auth.uid()
    )
  );

-- Product Royalties policies
CREATE POLICY "Users can view royalties for products they can view"
  ON product_royalties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_royalties.product_id
        AND (
          p.status = 'public'
          OR p.user_id = auth.uid()
          OR product_royalties.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM product_collaborators pc
            WHERE pc.product_id = p.id AND pc.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can insert royalties for their own products"
  ON product_royalties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_royalties.product_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update royalties for their own products"
  ON product_royalties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_royalties.product_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete royalties for their own products"
  ON product_royalties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_royalties.product_id AND p.user_id = auth.uid()
    )
  );

-- Step 13: Comments for documentation
COMMENT ON TABLE product_files IS 'Downloadable files attached to products (replaces asset_files)';
COMMENT ON TABLE product_components IS 'Product-in-product relationships - allows embedding products as components (replaces product_assets)';
COMMENT ON TABLE product_royalties IS 'Royalty splits for product contributors (replaces asset_royalties)';
COMMENT ON COLUMN products.is_embeddable IS 'Whether this product can be embedded into other products';
COMMENT ON COLUMN products.direct_sale_price_cents IS 'Price when sold directly to customers (optional)';
COMMENT ON COLUMN products.embedding_royalty_cents IS 'Royalty amount when embedded in another product (optional)';

-- NOTE: Do NOT drop old tables yet - keep them for rollback capability
-- After verifying the migration works correctly, you can drop:
-- DROP TABLE asset_downloads;
-- DROP TABLE asset_chat_message_attachments;
-- DROP TABLE asset_chat_message_reactions;
-- DROP TABLE asset_chat_messages;
-- DROP TABLE asset_licenses;
-- DROP TABLE asset_tags;
-- DROP TABLE asset_collaborators;
-- DROP TABLE asset_royalties;
-- DROP TABLE product_assets;
-- DROP TABLE asset_images;
-- DROP TABLE asset_files;
-- DROP TABLE assets;
