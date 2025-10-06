-- Create orders and transactions system for marketplace purchases

-- Orders table - stores purchase records
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT total_amount_positive CHECK (total_amount > 0)
);

-- Order items - individual projects purchased in an order
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  pricing_tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE RESTRICT,
  price DECIMAL(10, 2) NOT NULL,
  project_title TEXT NOT NULL,
  pricing_tier_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT price_positive CHECK (price > 0)
);

-- Revenue splits - tracks how revenue is distributed
CREATE TABLE IF NOT EXISTS revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT amount_positive CHECK (amount >= 0),
  CONSTRAINT percentage_valid CHECK (percentage >= 0 AND percentage <= 100)
);

-- Downloaded items - tracks what users have downloaded
CREATE TABLE IF NOT EXISTS downloaded_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  download_url TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT must_have_asset_or_document CHECK (
    (asset_id IS NOT NULL AND document_id IS NULL) OR
    (asset_id IS NULL AND document_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_project_id ON order_items(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_order_item_id ON revenue_splits(order_item_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_recipient_id ON revenue_splits(recipient_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_status ON revenue_splits(status);
CREATE INDEX IF NOT EXISTS idx_downloaded_items_user_id ON downloaded_items(user_id);
CREATE INDEX IF NOT EXISTS idx_downloaded_items_order_item_id ON downloaded_items(order_item_id);

-- RLS Policies

-- Orders: users can view their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "System can insert orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "System can update orders"
  ON orders FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Order items: users can view items from their orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Revenue splits: users can view their own revenue
ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revenue splits"
  ON revenue_splits FOR SELECT
  USING (auth.uid() = recipient_id);

-- Downloaded items: users can view their own downloads
ALTER TABLE downloaded_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads"
  ON downloaded_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON downloaded_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate format: WS-YYYYMMDD-XXXXX
    new_number := 'WS-' ||
                  to_char(now(), 'YYYYMMDD') || '-' ||
                  LPAD(floor(random() * 100000)::TEXT, 5, '0');

    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists_check;

    -- Exit loop if unique
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate revenue splits for an order item
CREATE OR REPLACE FUNCTION calculate_revenue_splits(
  p_order_item_id UUID,
  p_project_id UUID,
  p_price DECIMAL
)
RETURNS void AS $$
DECLARE
  v_creator_id UUID;
  v_total_royalty_percentage DECIMAL := 0;
  v_creator_percentage DECIMAL;
  v_platform_fee_percentage DECIMAL := 10; -- 10% platform fee
  v_platform_amount DECIMAL;
  v_creator_amount DECIMAL;
  v_collaborator_amount DECIMAL;
  v_collaborator RECORD;
  -- Platform account (special UUID for platform revenue tracking)
  v_platform_account_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Get project creator
  SELECT creator_id INTO v_creator_id
  FROM projects
  WHERE id = p_project_id;

  -- Calculate total royalty percentage from approved asset references
  SELECT COALESCE(SUM(royalty_percentage), 0) INTO v_total_royalty_percentage
  FROM project_asset_references
  WHERE project_id = p_project_id
  AND status = 'approved';

  -- Calculate platform fee amount
  v_platform_amount := p_price * v_platform_fee_percentage / 100;

  -- Insert platform revenue split
  IF v_platform_amount > 0 THEN
    INSERT INTO revenue_splits (order_item_id, recipient_id, amount, percentage, status)
    VALUES (p_order_item_id, v_platform_account_id, v_platform_amount, v_platform_fee_percentage, 'paid');
  END IF;

  -- Creator gets remainder after platform fee and royalties
  v_creator_percentage := 100 - v_platform_fee_percentage - v_total_royalty_percentage;
  v_creator_amount := p_price * v_creator_percentage / 100;

  -- Insert creator revenue split
  IF v_creator_amount > 0 THEN
    INSERT INTO revenue_splits (order_item_id, recipient_id, amount, percentage)
    VALUES (p_order_item_id, v_creator_id, v_creator_amount, v_creator_percentage);
  END IF;

  -- Insert revenue splits for collaborators (from asset references)
  FOR v_collaborator IN
    SELECT DISTINCT a.creator_id, par.royalty_percentage
    FROM project_asset_references par
    JOIN assets a ON a.id = par.asset_id
    WHERE par.project_id = p_project_id
    AND par.status = 'approved'
    AND a.creator_id != v_creator_id
  LOOP
    v_collaborator_amount := p_price * v_collaborator.royalty_percentage / 100;

    IF v_collaborator_amount > 0 THEN
      INSERT INTO revenue_splits (order_item_id, recipient_id, amount, percentage)
      VALUES (p_order_item_id, v_collaborator.creator_id, v_collaborator_amount, v_collaborator.royalty_percentage);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();
