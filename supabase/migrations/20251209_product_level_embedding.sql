-- Migration: Product-Level Embedding
-- Date: 2025-12-09
-- Description: Create product_components table with product-level embedding

-- Step 1: Create product_components table
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

-- Step 2: Enable RLS
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
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

-- Step 4: Add helpful comments
COMMENT ON COLUMN product_components.parent_product_id IS 'The product that embeds another product';
COMMENT ON COLUMN product_components.inherited_price_cents IS 'Price inherited from the embedded product at link time';

-- Step 5: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_components_parent_product
  ON product_components(parent_product_id)
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_product_components_child_product
  ON product_components(child_product_id)
  WHERE deleted = false;

-- Step 6: Add constraints
ALTER TABLE product_components
  ADD CONSTRAINT prevent_self_embedding
  CHECK (parent_product_id != child_product_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_components_unique_embedding
  ON product_components(parent_product_id, child_product_id)
  WHERE deleted = false;
