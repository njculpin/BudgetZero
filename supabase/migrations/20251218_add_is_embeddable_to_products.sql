-- Add is_embeddable column to products table
-- This allows creators to control whether their product can be embedded in other products

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_embeddable BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN products.is_embeddable IS 'Whether this product can be embedded as a component in other products';

-- Create index for filtering embeddable products
CREATE INDEX IF NOT EXISTS idx_products_is_embeddable ON products(is_embeddable) WHERE NOT deleted;
