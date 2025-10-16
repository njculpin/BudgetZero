-- Create product_status enum
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');

-- Add status column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'draft';

-- Add published_at column for tracking when products go live
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Add is_featured column for marketplace highlighting
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Add index for published products
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE status = 'published';

-- Comments for documentation
COMMENT ON COLUMN products.status IS 'Product publication status';
COMMENT ON COLUMN products.published_at IS 'Timestamp when product was first published';
COMMENT ON COLUMN products.is_featured IS 'Whether product should be featured in marketplace';
