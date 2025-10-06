-- Create Stripe Connect system for creator payouts

-- Stripe connected accounts table
CREATE TABLE IF NOT EXISTS stripe_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('express', 'standard')),
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  country TEXT,
  currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stripe_transfer_id TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Payout schedules table (for automatic monthly payouts)
CREATE TABLE IF NOT EXISTS payout_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  minimum_amount DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  last_payout_at TIMESTAMPTZ,
  next_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  CONSTRAINT minimum_amount_positive CHECK (minimum_amount >= 10.00)
);

-- Update revenue_splits to track transfers
ALTER TABLE revenue_splits
  ADD COLUMN IF NOT EXISTS payout_request_id UUID REFERENCES payout_requests(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_connected_accounts_user_id ON stripe_connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connected_accounts_stripe_id ON stripe_connected_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at ON payout_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_schedules_user_id ON payout_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_schedules_next_payout ON payout_schedules(next_payout_at) WHERE enabled = true;

-- RLS Policies

-- Stripe connected accounts: users can view own account
ALTER TABLE stripe_connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected account"
  ON stripe_connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage connected accounts"
  ON stripe_connected_accounts FOR ALL
  USING (auth.uid() = user_id);

-- Payout requests: users can view own requests
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payout schedules: users can manage own schedule
ALTER TABLE payout_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout schedule"
  ON payout_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payout schedule"
  ON payout_schedules FOR ALL
  USING (auth.uid() = user_id);

-- Function to calculate available balance for user
CREATE OR REPLACE FUNCTION get_available_balance(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_earned DECIMAL := 0;
  v_total_paid_out DECIMAL := 0;
  v_available DECIMAL := 0;
BEGIN
  -- Calculate total earned from revenue splits (only 'processing' status)
  -- 'paid' status means already included in a payout request
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM revenue_splits
  WHERE recipient_id = p_user_id
  AND status = 'processing';

  -- No need to subtract payouts - 'processing' splits are not yet paid out
  v_available := v_total_earned;

  RETURN GREATEST(v_available, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending earnings (not yet processed from orders)
CREATE OR REPLACE FUNCTION get_pending_earnings(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_pending DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_pending
  FROM revenue_splits
  WHERE recipient_id = p_user_id
  AND status = 'pending';

  RETURN v_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total lifetime earnings (all statuses except platform)
CREATE OR REPLACE FUNCTION get_lifetime_earnings(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_lifetime DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_lifetime
  FROM revenue_splits
  WHERE recipient_id = p_user_id;

  RETURN v_lifetime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next payout date
CREATE OR REPLACE FUNCTION calculate_next_payout_date(
  p_frequency TEXT,
  p_day_of_month INTEGER DEFAULT 1
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_date TIMESTAMPTZ;
  v_current_date TIMESTAMPTZ := now();
BEGIN
  CASE p_frequency
    WHEN 'weekly' THEN
      -- Next Monday
      v_next_date := date_trunc('week', v_current_date) + interval '7 days';

    WHEN 'biweekly' THEN
      -- Next other Monday (14 days)
      v_next_date := date_trunc('week', v_current_date) + interval '14 days';

    WHEN 'monthly' THEN
      -- Next month on specified day
      IF EXTRACT(DAY FROM v_current_date) >= p_day_of_month THEN
        -- Next month
        v_next_date := date_trunc('month', v_current_date) + interval '1 month';
      ELSE
        -- This month
        v_next_date := date_trunc('month', v_current_date);
      END IF;

      -- Set to specific day of month
      v_next_date := v_next_date + (p_day_of_month - 1) * interval '1 day';

    ELSE
      v_next_date := v_current_date + interval '1 month';
  END CASE;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_payout_at when schedule is created or updated
CREATE OR REPLACE FUNCTION update_next_payout_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enabled THEN
    NEW.next_payout_at := calculate_next_payout_date(NEW.frequency, NEW.day_of_month);
  ELSE
    NEW.next_payout_at := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_payout_date
  BEFORE INSERT OR UPDATE ON payout_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_payout_date();

-- Function to process automatic payouts (called by cron job)
CREATE OR REPLACE FUNCTION process_scheduled_payouts()
RETURNS TABLE(user_id UUID, amount DECIMAL) AS $$
DECLARE
  v_schedule RECORD;
  v_available DECIMAL;
BEGIN
  -- Find all schedules that are due for payout
  FOR v_schedule IN
    SELECT ps.user_id, ps.minimum_amount, ps.frequency, ps.day_of_month
    FROM payout_schedules ps
    WHERE ps.enabled = true
    AND ps.next_payout_at <= now()
    AND EXISTS (
      SELECT 1 FROM stripe_connected_accounts sca
      WHERE sca.user_id = ps.user_id
      AND sca.payouts_enabled = true
    )
  LOOP
    -- Calculate available balance
    v_available := get_available_balance(v_schedule.user_id);

    -- Only create payout if balance meets minimum
    IF v_available >= v_schedule.minimum_amount THEN
      -- Create payout request
      INSERT INTO payout_requests (user_id, amount, status, requested_at)
      VALUES (v_schedule.user_id, v_available, 'pending', now());

      -- Update schedule
      UPDATE payout_schedules
      SET
        last_payout_at = now(),
        next_payout_at = calculate_next_payout_date(v_schedule.frequency, v_schedule.day_of_month)
      WHERE payout_schedules.user_id = v_schedule.user_id;

      -- Return the payout info
      RETURN QUERY SELECT v_schedule.user_id, v_available;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
