-- Create commerce tables for shopping cart, sales, and royalties

-- ============================================
-- SHOPPING CART TABLES
-- ============================================

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, variant_id)
);

-- ============================================
-- SALES TABLES
-- ============================================

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_charge_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  refund_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create sale_item_assets table (links purchased items to downloadable assets)
CREATE TABLE IF NOT EXISTS sale_item_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(sale_item_id, asset_id)
);

-- ============================================
-- ROYALTY TABLES
-- ============================================

-- Create asset_royalties table
CREATE TABLE IF NOT EXISTS asset_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value NUMERIC NOT NULL CHECK (royalty_value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create sale_royalty_transactions table
CREATE TABLE IF NOT EXISTS sale_royalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  sale_item_asset_id UUID NOT NULL REFERENCES sale_item_assets(id) ON DELETE CASCADE,
  asset_royalty_id UUID NOT NULL REFERENCES asset_royalties(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value NUMERIC NOT NULL CHECK (royalty_value >= 0),
  calculated_cents INTEGER NOT NULL CHECK (calculated_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready_to_pay', 'paid', 'failed', 'refunded')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- WISHLIST TABLE
-- ============================================

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for carts
CREATE INDEX IF NOT EXISTS carts_user_id_idx ON carts(user_id);

-- Indexes for cart_items
CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS cart_items_variant_id_idx ON cart_items(variant_id);

-- Indexes for sales
CREATE INDEX IF NOT EXISTS sales_user_id_idx ON sales(user_id);
CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);
CREATE INDEX IF NOT EXISTS sales_stripe_charge_id_idx ON sales(stripe_charge_id);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales(created_at DESC);

-- Indexes for sale_items
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS sale_items_variant_id_idx ON sale_items(variant_id);

-- Indexes for sale_item_assets
CREATE INDEX IF NOT EXISTS sale_item_assets_sale_item_id_idx ON sale_item_assets(sale_item_id);
CREATE INDEX IF NOT EXISTS sale_item_assets_asset_id_idx ON sale_item_assets(asset_id);

-- Indexes for asset_royalties
CREATE INDEX IF NOT EXISTS asset_royalties_asset_id_idx ON asset_royalties(asset_id);
CREATE INDEX IF NOT EXISTS asset_royalties_user_id_idx ON asset_royalties(user_id);

-- Indexes for sale_royalty_transactions
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_sale_id_idx ON sale_royalty_transactions(sale_id);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_recipient_user_id_idx ON sale_royalty_transactions(recipient_user_id);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_status_idx ON sale_royalty_transactions(status);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_paid_at_idx ON sale_royalty_transactions(paid_at);

-- Indexes for wishlists
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS wishlists_product_id_idx ON wishlists(product_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_item_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_royalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carts
CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cart"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart"
  ON carts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cart_items
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- RLS Policies for sales
CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sales"
  ON sales FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sale_items
CREATE POLICY "Users can view own sale items"
  ON sale_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage sale items"
  ON sale_items FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sale_item_assets
CREATE POLICY "Users can view assets from own sales"
  ON sale_item_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.id = sale_item_assets.sale_item_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage sale item assets"
  ON sale_item_assets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for asset_royalties
CREATE POLICY "Asset royalties visible to asset owner and recipient"
  ON asset_royalties FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_royalties.asset_id
      AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Asset owners can manage royalties"
  ON asset_royalties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_royalties.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- RLS Policies for sale_royalty_transactions
CREATE POLICY "Recipients and buyers can view transactions"
  ON sale_royalty_transactions FOR SELECT
  USING (
    auth.uid() = recipient_user_id
    OR EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_royalty_transactions.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage royalty transactions"
  ON sale_royalty_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for wishlists
CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_carts
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_cart_items
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_sales
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_sale_items
  BEFORE UPDATE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_sale_item_assets
  BEFORE UPDATE ON sale_item_assets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_royalties
  BEFORE UPDATE ON asset_royalties
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_sale_royalty_transactions
  BEFORE UPDATE ON sale_royalty_transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_wishlists
  BEFORE UPDATE ON wishlists
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
