-- Payout reservation
--
-- Royalty transactions were created as 'ready_to_pay' and nothing ever moved them
-- off it. A creator could request a payout, be paid, and still have the same
-- transactions counted as available balance — so the same earnings could be
-- withdrawn repeatedly. Selecting which transactions a payout covered was also a
-- guess (requested amount divided by the average transaction value), so payout_items
-- never actually summed to the amount transferred.
--
-- The fix is a reservation step, performed in one atomic function so that two
-- concurrent requests cannot both claim the same transactions.

-- ============================================
-- 1. ADD 'reserved' STATUS
-- ============================================

-- 'reserved' means: attached to a pending payout, no longer part of available
-- balance, not yet transferred. It sits between 'ready_to_pay' and 'paid'.
ALTER TABLE public.sale_royalty_transactions
  DROP CONSTRAINT IF EXISTS sale_royalty_transactions_status_check;

ALTER TABLE public.sale_royalty_transactions
  ADD CONSTRAINT sale_royalty_transactions_status_check
  CHECK (status IN ('pending', 'ready_to_pay', 'reserved', 'paid', 'failed', 'refunded'));

COMMENT ON COLUMN public.sale_royalty_transactions.status IS
  'pending -> ready_to_pay -> reserved (attached to a pending payout) -> paid. '
  'refunded and failed are terminal.';

-- Available-balance lookups filter on (recipient, status); payout settlement looks up
-- by payout via payout_items.
CREATE INDEX IF NOT EXISTS idx_royalty_tx_recipient_status
  ON public.sale_royalty_transactions (recipient_user_id, status)
  WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_payout_items_payout
  ON public.payout_items (payout_id);

-- A royalty transaction must never appear in two payouts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_items_royalty_tx_unique
  ON public.payout_items (royalty_transaction_id);

-- ============================================
-- 2. ATOMIC PAYOUT REQUEST
-- ============================================

-- Selects whole royalty transactions, oldest first, accumulating while the running
-- total stays within the requested amount, then reserves exactly that set.
--
-- Transactions are indivisible, so the payout is created for the sum of the
-- transactions actually selected — which may be less than requested. The caller must
-- treat the returned amount as authoritative rather than echoing the request.
--
-- FOR UPDATE SKIP LOCKED means a concurrent request for the same user takes a
-- disjoint set instead of blocking or double-counting.
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

  -- Greedily take whole transactions, oldest first, while they still fit.
  FOR v_row IN
    SELECT id, calculated_cents
    FROM sale_royalty_transactions
    WHERE recipient_user_id = p_user_id
      AND status = 'ready_to_pay'
      AND deleted = FALSE
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    EXIT WHEN v_total + v_row.calculated_cents > p_amount_cents;
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

  -- Record exactly which transactions this payout covers, at their real amounts.
  INSERT INTO payout_items (payout_id, royalty_transaction_id, amount_cents)
  SELECT v_payout_id, srt.id, srt.calculated_cents
  FROM sale_royalty_transactions srt
  WHERE srt.id = ANY(v_selected);

  -- Reserve them so they leave the available balance.
  UPDATE sale_royalty_transactions
  SET status = 'reserved', updated_at = NOW()
  WHERE id = ANY(v_selected);

  RETURN QUERY SELECT v_payout_id, v_total, v_count;
END;
$$;

COMMENT ON FUNCTION public.request_payout IS
  'Atomically reserve royalty transactions for a payout. Returns the payout id and '
  'the amount actually reserved, which may be less than requested because whole '
  'transactions are indivisible.';

-- ============================================
-- 3. SETTLEMENT
-- ============================================

-- Called after a Stripe transfer succeeds: the reserved transactions become paid.
CREATE OR REPLACE FUNCTION public.settle_payout(
  p_payout_id UUID,
  p_stripe_transfer_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE sale_royalty_transactions
  SET status = 'paid',
      stripe_transfer_id = p_stripe_transfer_id,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id IN (
    SELECT royalty_transaction_id FROM payout_items WHERE payout_id = p_payout_id
  )
  AND status = 'reserved';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE payouts
  SET status = 'paid',
      stripe_transfer_id = p_stripe_transfer_id,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payout_id;

  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.settle_payout IS
  'Mark a payout paid and transition its reserved royalty transactions to paid.';

-- Called when a transfer fails or a payout is cancelled: reservations go back into
-- the available balance so the creator is not left stranded.
CREATE OR REPLACE FUNCTION public.release_payout(
  p_payout_id UUID,
  p_failed_reason TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE sale_royalty_transactions
  SET status = 'ready_to_pay', updated_at = NOW()
  WHERE id IN (
    SELECT royalty_transaction_id FROM payout_items WHERE payout_id = p_payout_id
  )
  AND status = 'reserved';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Drop the items so the transactions are free to join a future payout. The unique
  -- index on royalty_transaction_id would otherwise block them forever.
  DELETE FROM payout_items WHERE payout_id = p_payout_id;

  UPDATE payouts
  SET status = 'failed',
      failed_reason = COALESCE(p_failed_reason, failed_reason),
      updated_at = NOW()
  WHERE id = p_payout_id;

  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.release_payout IS
  'Return a failed payout''s reserved royalty transactions to available balance.';

-- These functions are invoked by the service role from the API layer only.
REVOKE ALL ON FUNCTION public.request_payout(UUID, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_payout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_payout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
