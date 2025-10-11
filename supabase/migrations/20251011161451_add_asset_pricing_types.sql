-- Add pricing type and interval fields to asset_pricing table
-- Supports free, one-time purchase, and subscription-based pricing

-- Add pricing_type enum
CREATE TYPE pricing_type AS ENUM ('free', 'one_time', 'subscription');

-- Add billing interval for subscriptions
CREATE TYPE billing_interval AS ENUM ('month', 'year');

-- Add new columns to asset_pricing
ALTER TABLE asset_pricing
  ADD COLUMN pricing_type pricing_type DEFAULT 'one_time' NOT NULL,
  ADD COLUMN billing_interval billing_interval,
  ADD COLUMN stripe_price_id TEXT,
  ADD COLUMN stripe_product_id TEXT;

-- Add constraint: subscriptions must have billing interval
ALTER TABLE asset_pricing
  ADD CONSTRAINT check_subscription_interval
  CHECK (
    (pricing_type != 'subscription') OR
    (pricing_type = 'subscription' AND billing_interval IS NOT NULL)
  );

-- Add constraint: free assets must have price_cents = 0
ALTER TABLE asset_pricing
  ADD CONSTRAINT check_free_price
  CHECK (
    (pricing_type != 'free') OR
    (pricing_type = 'free' AND price_cents = 0)
  );

-- Add index for faster queries by asset_id and active status
CREATE INDEX idx_asset_pricing_asset_active ON asset_pricing(asset_id, is_active);

-- Add index for Stripe IDs for webhook lookups
CREATE INDEX idx_asset_pricing_stripe_price ON asset_pricing(stripe_price_id) WHERE stripe_price_id IS NOT NULL;

-- Update RLS policies for asset_pricing
ALTER TABLE asset_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active pricing for public assets
CREATE POLICY "Public can view active pricing"
  ON asset_pricing
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM assets a
      INNER JOIN asset_settings s ON s.asset_id = a.id
      WHERE a.id = asset_pricing.asset_id
        AND s.is_public = true
        AND a.status = 'active'
    )
  );

-- Policy: Asset owners can view all pricing for their assets
CREATE POLICY "Owners can view all pricing"
  ON asset_pricing
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_pricing.asset_id
        AND assets.creator_id = auth.uid()
    )
  );

-- Policy: Asset owners can insert pricing for their assets
CREATE POLICY "Owners can insert pricing"
  ON asset_pricing
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_pricing.asset_id
        AND assets.creator_id = auth.uid()
    )
  );

-- Policy: Asset owners can update pricing for their assets
CREATE POLICY "Owners can update pricing"
  ON asset_pricing
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_pricing.asset_id
        AND assets.creator_id = auth.uid()
    )
  );

-- Policy: Asset owners can delete pricing for their assets
CREATE POLICY "Owners can delete pricing"
  ON asset_pricing
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_pricing.asset_id
        AND assets.creator_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_asset_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_pricing_updated_at_trigger
  BEFORE UPDATE ON asset_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_pricing_updated_at();
