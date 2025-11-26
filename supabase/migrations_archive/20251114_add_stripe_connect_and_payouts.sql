-- Add Stripe Connect account ID to users table
ALTER TABLE users
ADD COLUMN stripe_connect_account_id TEXT,
ADD COLUMN stripe_connect_onboarded BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connect_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Create payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create payout_items table (links payouts to specific royalty transactions)
CREATE TABLE payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  royalty_transaction_id UUID NOT NULL REFERENCES sale_royalty_transactions(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_requested_at ON payouts(requested_at DESC);
CREATE INDEX idx_payout_items_payout_id ON payout_items(payout_id);
CREATE INDEX idx_payout_items_royalty_transaction_id ON payout_items(royalty_transaction_id);

-- Add RLS policies
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own payouts
CREATE POLICY "Users can view their own payouts"
  ON payouts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create payout requests
CREATE POLICY "Users can create payout requests"
  ON payouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can view their own payout items
CREATE POLICY "Users can view their own payout items"
  ON payout_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payouts
      WHERE payouts.id = payout_items.payout_id
      AND payouts.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER payouts_updated_at
BEFORE UPDATE ON payouts
FOR EACH ROW
EXECUTE FUNCTION update_payouts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE payouts IS 'Payout requests and transfers to contributors';
COMMENT ON TABLE payout_items IS 'Individual royalty transactions included in each payout';
COMMENT ON COLUMN users.stripe_connect_account_id IS 'Stripe Connect account ID for receiving payouts';
COMMENT ON COLUMN users.stripe_connect_onboarded IS 'Whether user has completed Stripe Connect onboarding';
COMMENT ON COLUMN users.stripe_connect_details_submitted IS 'Whether user has submitted required details to Stripe';
COMMENT ON COLUMN users.stripe_connect_charges_enabled IS 'Whether Stripe account can accept charges';
COMMENT ON COLUMN users.stripe_connect_payouts_enabled IS 'Whether Stripe account can receive payouts';
