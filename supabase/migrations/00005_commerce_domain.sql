-- Commerce Domain
-- Shopping carts, sales, royalty transactions, wishlists, and payouts

-- ============================================
-- 1. SHOPPING CART
-- ============================================

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE public.carts IS 'Shopping carts for users';

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

COMMENT ON TABLE public.cart_items IS 'Items in shopping carts';

-- ============================================
-- 2. SALES
-- ============================================

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_charge_id TEXT NOT NULL UNIQUE,
  payment_method TEXT DEFAULT 'stripe' NOT NULL CHECK (payment_method IN ('stripe', 'credits')),
  shipping_address JSONB,
  order_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  refund_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.sales IS 'Completed sales transactions';
COMMENT ON COLUMN public.sales.payment_method IS 'Payment method used: stripe (real payment) or credits (mock payment for testing)';
COMMENT ON COLUMN public.sales.shipping_address IS 'Customer shipping address for physical service orders. Format: {name, address1, address2, city, state, postal_code, country}';
COMMENT ON COLUMN public.sales.order_notes IS 'Customer notes for service providers (color preferences, materials, special instructions)';

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.sale_items IS 'Line items in sales with product snapshots at time of purchase';

-- ============================================
-- 3. ROYALTY TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.sale_royalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  product_royalty_id UUID NOT NULL REFERENCES public.product_royalties(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value INTEGER NOT NULL CHECK (royalty_value >= 0),
  calculated_cents INTEGER NOT NULL CHECK (calculated_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready_to_pay', 'paid', 'failed', 'refunded')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.sale_royalty_transactions IS 'Royalty payments owed to contributors per sale';
COMMENT ON COLUMN public.sale_royalty_transactions.product_royalty_id IS 'References product_royalties table (product-based model)';
COMMENT ON COLUMN public.sale_royalty_transactions.royalty_type IS 'fixed = cents, percentage = 0-100';
COMMENT ON COLUMN public.sale_royalty_transactions.royalty_value IS 'For fixed: cents, for percentage: 0-100';

-- ============================================
-- 4. WISHLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

COMMENT ON TABLE public.wishlists IS 'User wishlists for products';

-- ============================================
-- 5. PAYOUTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  stripe_transfer_id TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payouts IS 'Payout requests and transfers to contributors';

CREATE TABLE IF NOT EXISTS public.payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  royalty_transaction_id UUID NOT NULL REFERENCES public.sale_royalty_transactions(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payout_items IS 'Individual royalty transactions included in each payout';

-- ============================================
-- 6. INDEXES
-- ============================================

-- Carts indexes
CREATE INDEX IF NOT EXISTS carts_user_id_idx ON public.carts(user_id);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx ON public.cart_items(product_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS sales_user_id_idx ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS sales_status_idx ON public.sales(status);
CREATE INDEX IF NOT EXISTS sales_stripe_charge_id_idx ON public.sales(stripe_charge_id);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales(created_at DESC);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON public.sale_items(product_id);

-- Royalty transactions indexes
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_sale_id_idx ON public.sale_royalty_transactions(sale_id);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_sale_item_id_idx ON public.sale_royalty_transactions(sale_item_id);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_product_royalty_id_idx ON public.sale_royalty_transactions(product_royalty_id);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_recipient_user_id_idx ON public.sale_royalty_transactions(recipient_user_id);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_status_idx ON public.sale_royalty_transactions(status);
CREATE INDEX IF NOT EXISTS sale_royalty_transactions_paid_at_idx ON public.sale_royalty_transactions(paid_at);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS wishlists_product_id_idx ON public.wishlists(product_id);

-- Payouts indexes
CREATE INDEX IF NOT EXISTS payouts_user_id_idx ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS payouts_status_idx ON public.payouts(status);
CREATE INDEX IF NOT EXISTS payouts_requested_at_idx ON public.payouts(requested_at DESC);

-- Payout items indexes
CREATE INDEX IF NOT EXISTS payout_items_payout_id_idx ON public.payout_items(payout_id);
CREATE INDEX IF NOT EXISTS payout_items_royalty_transaction_id_idx ON public.payout_items(royalty_transaction_id);

-- ============================================
-- 7. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_carts
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_cart_items
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sales
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sale_items
  BEFORE UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sale_royalty_transactions
  BEFORE UPDATE ON public.sale_royalty_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_wishlists
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_payouts
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_royalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carts
CREATE POLICY "Users can view own cart"
  ON public.carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cart"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON public.carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart"
  ON public.carts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cart_items
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- RLS Policies for sales
CREATE POLICY "Users can view own sales"
  ON public.sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sales"
  ON public.sales FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sale_items
CREATE POLICY "Users can view own sale items"
  ON public.sale_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage sale items"
  ON public.sale_items FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sale_royalty_transactions
CREATE POLICY "Recipients can view own royalty transactions"
  ON public.sale_royalty_transactions FOR SELECT
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Service role can manage royalty transactions"
  ON public.sale_royalty_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for wishlists
CREATE POLICY "Users can view own wishlists"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlists"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for payouts
CREATE POLICY "Users can view own payouts"
  ON public.payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request own payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage payouts"
  ON public.payouts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for payout_items
CREATE POLICY "Users can view own payout items"
  ON public.payout_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payouts
      WHERE payouts.id = payout_items.payout_id
      AND payouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payout items"
  ON public.payout_items FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
