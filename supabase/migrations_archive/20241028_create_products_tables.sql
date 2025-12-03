-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'public', 'archived')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_digital BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create product_variant_prices table
CREATE TABLE IF NOT EXISTS product_variant_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'usd',
  unit_amount INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, min_quantity)
);

-- Create product_assets table (links variants to downloadable assets)
CREATE TABLE IF NOT EXISTS product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, asset_id)
);

-- Create product_tags table
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE (product_id, value)
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS products_handle_idx ON products(handle);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);

-- Create indexes for product_variants
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON product_variants(sku);

-- Create indexes for product_variant_prices
CREATE INDEX IF NOT EXISTS product_variant_prices_variant_id_idx ON product_variant_prices(variant_id);

-- Create indexes for product_assets
CREATE INDEX IF NOT EXISTS product_assets_variant_id_idx ON product_assets(variant_id);
CREATE INDEX IF NOT EXISTS product_assets_asset_id_idx ON product_assets(asset_id);

-- Create indexes for product_tags
CREATE INDEX IF NOT EXISTS product_tags_product_id_idx ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS product_tags_value_idx ON product_tags(value);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "public products are viewable by everyone"
  ON products FOR SELECT
  USING (status = 'public' AND deleted = FALSE);

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_variants
CREATE POLICY "Product variants visible via product"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own product variants"
  ON product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for product_variant_prices
CREATE POLICY "Prices visible via variant"
  ON product_variant_prices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_variant_prices.variant_id
      AND (p.status = 'public' OR p.user_id = auth.uid())
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own variant prices"
  ON product_variant_prices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_variant_prices.variant_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_assets
CREATE POLICY "Product assets visible via variant"
  ON product_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_assets.variant_id
      AND (p.status = 'public' OR p.user_id = auth.uid())
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own product assets"
  ON product_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = product_assets.variant_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_tags
CREATE POLICY "Product tags visible via product"
  ON product_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_tags.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Users can manage own product tags"
  ON product_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_tags.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_variants
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_product_variant_prices
  BEFORE UPDATE ON product_variant_prices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
