-- Create user_asset_purchases table to track asset purchases and subscriptions
-- This table records when users purchase or subscribe to assets

CREATE TYPE purchase_status AS ENUM ('active', 'cancelled', 'expired', 'refunded');

CREATE TABLE user_asset_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  asset_pricing_id UUID REFERENCES asset_pricing(id) ON DELETE SET NULL,

  -- Purchase details
  purchase_status purchase_status DEFAULT 'active' NOT NULL,
  price_paid_cents INTEGER NOT NULL CHECK (price_paid_cents >= 0),

  -- Stripe details
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,

  -- Subscription details (if applicable)
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  subscription_cancelled_at TIMESTAMPTZ,

  -- Metadata
  purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one active purchase per user per asset (for one-time purchases)
  -- Subscriptions can have multiple records over time
  UNIQUE(user_id, asset_id, stripe_subscription_id)
);

-- Add indexes for performance
CREATE INDEX idx_user_asset_purchases_user ON user_asset_purchases(user_id);
CREATE INDEX idx_user_asset_purchases_asset ON user_asset_purchases(asset_id);
CREATE INDEX idx_user_asset_purchases_status ON user_asset_purchases(user_id, purchase_status);
CREATE INDEX idx_user_asset_purchases_stripe_sub ON user_asset_purchases(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_user_asset_purchases_stripe_payment ON user_asset_purchases(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Add composite index for checking active access
CREATE INDEX idx_user_asset_active_access ON user_asset_purchases(user_id, asset_id, purchase_status)
  WHERE purchase_status = 'active';

-- Enable RLS
ALTER TABLE user_asset_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON user_asset_purchases
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Asset owners can view purchases of their assets
CREATE POLICY "Asset owners can view asset purchases"
  ON user_asset_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = user_asset_purchases.asset_id
        AND assets.creator_id = auth.uid()
    )
  );

-- Policy: Only system/service role can insert purchases (via Stripe webhooks)
-- Users cannot directly insert purchase records
CREATE POLICY "Service role can insert purchases"
  ON user_asset_purchases
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy: Only system/service role can update purchases (via Stripe webhooks)
CREATE POLICY "Service role can update purchases"
  ON user_asset_purchases
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_asset_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_asset_purchases_updated_at_trigger
  BEFORE UPDATE ON user_asset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_user_asset_purchases_updated_at();

-- Create helper function to check if user has access to an asset
CREATE OR REPLACE FUNCTION user_has_asset_access(
  p_user_id UUID,
  p_asset_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_asset_purchases
    WHERE user_id = p_user_id
      AND asset_id = p_asset_id
      AND purchase_status = 'active'
      AND (
        -- One-time purchase (no expiration)
        stripe_subscription_id IS NULL
        OR
        -- Active subscription
        (
          stripe_subscription_id IS NOT NULL
          AND subscription_end_date IS NULL
        )
        OR
        -- Subscription not yet expired
        (
          stripe_subscription_id IS NOT NULL
          AND subscription_end_date > NOW()
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION user_has_asset_access(UUID, UUID) TO authenticated;
