-- Royalty hold period
--
-- Royalties were payable the instant a sale completed. A buyer could purchase on
-- Monday, the creator could request and be paid on Tuesday, and the buyer could
-- refund on Wednesday — at which point the platform has paid out money it has
-- since returned, with no way to recover it.
--
-- 00012 handles a refund that arrives while a payout is pending, and reversals
-- after the fact, but neither can claw back a completed transfer. A hold period
-- is the thing that makes those cases rare rather than routine: it keeps earnings
-- unpayable until the window in which most refunds happen has passed.
--
-- Implemented as a maturity timestamp rather than a status the a cron job flips,
-- so there is no scheduled job to fail silently and no window where the balance
-- is wrong because that job has not run yet.

-- ============================================
-- 1. MATURITY
-- ============================================

ALTER TABLE public.sale_royalty_transactions
  ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.sale_royalty_transactions.available_at IS
  'When this royalty becomes payable. Set to the sale time plus the hold period '
  'so a refund inside that window is caught before the money leaves. Rows created '
  'before this column existed default to NOW(), i.e. immediately available.';

-- The balance query filters on (recipient, status, available_at) and orders by
-- created_at, so all four belong in the index.
DROP INDEX IF EXISTS idx_royalty_tx_recipient_status_created;

CREATE INDEX IF NOT EXISTS idx_royalty_tx_recipient_available
  ON public.sale_royalty_transactions
    (recipient_user_id, status, available_at, created_at)
  WHERE deleted = FALSE;

-- The hold period lives here, in one place, rather than being duplicated across
-- the insert path and the two read paths.
--
-- 14 days covers the great majority of consumer refund requests on digital goods
-- without making creators wait a month to be paid. It is deliberately far shorter
-- than Stripe's 120-day dispute window: a chargeback that late is rare enough to
-- handle as a reversal (see 00012) rather than by holding everyone's money for
-- four months.
CREATE OR REPLACE FUNCTION public.royalty_hold_interval()
RETURNS INTERVAL
LANGUAGE sql
IMMUTABLE
AS $$ SELECT INTERVAL '14 days' $$;

COMMENT ON FUNCTION public.royalty_hold_interval IS
  'How long a royalty is held before it can be paid out. Change here only.';

-- New royalties mature after the hold period. A trigger rather than a column
-- DEFAULT so existing rows keep NOW() (immediately available) while new ones are
-- held, and so the insert path cannot forget.
CREATE OR REPLACE FUNCTION public.set_royalty_available_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only on insert, and only when the caller has not set it explicitly — a
  -- backfill or an admin correction may need to override.
  IF NEW.available_at IS NULL OR NEW.available_at = NOW()::TIMESTAMPTZ THEN
    NEW.available_at := NOW() + royalty_hold_interval();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_royalty_available_at ON public.sale_royalty_transactions;

CREATE TRIGGER trg_set_royalty_available_at
BEFORE INSERT ON public.sale_royalty_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_royalty_available_at();

-- ============================================
-- 2. RESERVATION RESPECTS MATURITY
-- ============================================

-- Replaces the 00011 version. Same greedy selection, plus the maturity filter.
CREATE OR REPLACE FUNCTION public.request_payout(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_minimum_cents INTEGER DEFAULT 1000,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (payout_id UUID, reserved_cents INTEGER, transaction_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout_id UUID;
  v_total INTEGER := 0;
  v_count INTEGER := 0;
  v_selected UUID[] := ARRAY[]::UUID[];
  v_row RECORD;
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Payout amount must be positive';
  END IF;

  FOR v_row IN
    SELECT id, calculated_cents
    FROM sale_royalty_transactions
    WHERE recipient_user_id = p_user_id
      AND status = 'ready_to_pay'
      AND deleted = FALSE
      AND available_at <= NOW()
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    IF v_total + v_row.calculated_cents > p_amount_cents THEN
      CONTINUE;
    END IF;

    v_total := v_total + v_row.calculated_cents;
    v_count := v_count + 1;
    v_selected := array_append(v_selected, v_row.id);
  END LOOP;

  IF v_total < p_minimum_cents THEN
    RAISE EXCEPTION
      'Insufficient available balance: % cents claimable against a % cent minimum',
      v_total, p_minimum_cents
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO payouts (user_id, amount_cents, currency, status, notes)
  VALUES (p_user_id, v_total, 'usd', 'pending', p_notes)
  RETURNING id INTO v_payout_id;

  INSERT INTO payout_items (payout_id, royalty_transaction_id, amount_cents)
  SELECT v_payout_id, srt.id, srt.calculated_cents
  FROM sale_royalty_transactions srt
  WHERE srt.id = ANY(v_selected);

  UPDATE sale_royalty_transactions
  SET status = 'reserved', updated_at = NOW()
  WHERE id = ANY(v_selected);

  RETURN QUERY SELECT v_payout_id, v_total, v_count;
END;
$$;

-- Reversed royalties become owed again, but they have already served their hold —
-- the sale is long settled and the money moved once. Re-holding would punish a
-- creator for a reversal that is usually not their doing.
CREATE OR REPLACE FUNCTION public.reverse_payout(
  p_stripe_transfer_id TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (out_payout_id UUID, out_restored_count INTEGER, out_amount_cents INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout RECORD;
  v_restored INTEGER;
BEGIN
  SELECT id, status, payouts.amount_cents
  INTO v_payout
  FROM payouts
  WHERE stripe_transfer_id = p_stripe_transfer_id
  FOR UPDATE;

  IF v_payout.id IS NULL THEN
    RETURN;
  END IF;

  IF v_payout.status = 'reversed' THEN
    RETURN QUERY SELECT v_payout.id, 0, v_payout.amount_cents;
    RETURN;
  END IF;

  UPDATE sale_royalty_transactions
  SET status = 'ready_to_pay',
      stripe_transfer_id = NULL,
      paid_at = NULL,
      available_at = NOW(),
      updated_at = NOW()
  WHERE id IN (
    SELECT pi.royalty_transaction_id FROM payout_items pi
    WHERE pi.payout_id = v_payout.id AND NOT pi.voided
  )
  AND status = 'paid';

  GET DIAGNOSTICS v_restored = ROW_COUNT;

  UPDATE payout_items pi SET voided = TRUE WHERE pi.payout_id = v_payout.id;

  UPDATE payouts
  SET status = 'reversed',
      failed_reason = COALESCE(p_reason, 'Transfer reversed by Stripe'),
      updated_at = NOW()
  WHERE id = v_payout.id;

  RETURN QUERY SELECT v_payout.id, v_restored, v_payout.amount_cents;
END;
$$;

REVOKE ALL ON FUNCTION public.request_payout(UUID, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reverse_payout(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_royalty_available_at() FROM PUBLIC, anon, authenticated;
