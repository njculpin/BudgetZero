-- Payout integrity corrections
--
-- 00008 introduced request_payout() as the only sanctioned way to create a payout
-- and revoked EXECUTE on it from clients. It did not, however, close the door it
-- was meant to replace, nor guard the state transitions on the way out. Three
-- separate ways to get money wrong survived, all confirmed against a live database.

-- ============================================
-- 1. CLOSE THE DIRECT INSERT PATH
-- ============================================

-- 00005 granted every authenticated client INSERT on `payouts`. PostgREST exposes
-- the table, so a client could insert a payout with an arbitrary amount_cents and
-- no backing payout_items at all — sidestepping reservation entirely. Combined with
-- execute.ts trusting payout.amount_cents when it calls Stripe, the only thing
-- standing between that and a real transfer was an admin noticing "$9,999,999.99 /
-- 0 royalties" in the queue.
--
-- Payouts are now created exclusively by request_payout(), which runs SECURITY
-- DEFINER under the service role. Clients keep SELECT so they can still see their
-- own payout history.
DROP POLICY IF EXISTS "Users can request own payouts" ON public.payouts;

-- ============================================
-- 2. PRESERVE THE RECORD OF FAILED PAYOUTS
-- ============================================

-- release_payout() deleted payout_items to free the transactions for a future
-- payout, satisfying the unique index. That threw away which transactions a failed
-- payout had attempted — exactly what an operator needs when reconciling a failed
-- transfer. Voiding instead keeps the history, and a partial unique index keeps the
-- "one live payout per royalty transaction" guarantee.
ALTER TABLE public.payout_items
  ADD COLUMN IF NOT EXISTS voided BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.payout_items.voided IS
  'True when the parent payout failed and this line was returned to the balance. '
  'Kept rather than deleted so a failed payout still shows what it attempted.';

DROP INDEX IF EXISTS idx_payout_items_royalty_tx_unique;

CREATE UNIQUE INDEX idx_payout_items_royalty_tx_unique
  ON public.payout_items (royalty_transaction_id)
  WHERE NOT voided;

-- request_payout orders by created_at; without it in the index that is a sort.
DROP INDEX IF EXISTS idx_royalty_tx_recipient_status;

CREATE INDEX IF NOT EXISTS idx_royalty_tx_recipient_status_created
  ON public.sale_royalty_transactions (recipient_user_id, status, created_at)
  WHERE deleted = FALSE;

-- ============================================
-- 3. SELECT WHAT FITS, NOT JUST THE LEADING RUN
-- ============================================

-- `EXIT WHEN` ended the whole scan at the first transaction too large to fit,
-- rather than skipping it. A creator whose oldest royalty is large was locked out
-- of every partial withdrawal smaller than the prefix sum through that row — with
-- no way to age out of it. Verified live: $90 + 4x$5 available, requesting $15
-- returned "Insufficient available balance: 0 cents claimable".
--
-- CONTINUE skips the oversized row and keeps scanning. The trade-off is that the
-- loop now locks every ready_to_pay row for the user rather than just the prefix
-- it takes, so two concurrent requests from the SAME user serialize instead of
-- taking disjoint sets. Payout requests are rare and human-initiated; correctness
-- is worth more than that concurrency here.
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

-- ============================================
-- 4. GUARD THE TERMINAL TRANSITIONS
-- ============================================

-- Neither function checked the payout's own status before updating it, so a late
-- or duplicate call could rewrite a terminal state. Confirmed live: releasing a
-- payout and then settling it left a row marked 'paid' with a real-looking
-- stripe_transfer_id, a paid_at, zero backing payout_items, and its royalties
-- sitting back in ready_to_pay — free to be reserved into a second, real payout.
-- Any reconciliation summing paid payouts would overstate real transfers.
--
-- The symmetric case was worse: release_payout on an already-paid payout left the
-- transactions alone but still flipped the row to 'failed' and deleted the line
-- items of a completed transfer.
--
-- SELECT ... FOR UPDATE serialises concurrent callers, and the status check turns
-- a silent overwrite into a loud exception.
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
  v_status TEXT;
BEGIN
  SELECT status INTO v_status FROM payouts WHERE id = p_payout_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Payout % does not exist', p_payout_id;
  END IF;

  IF v_status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Payout % is % and cannot be settled', p_payout_id, v_status;
  END IF;

  UPDATE sale_royalty_transactions
  SET status = 'paid',
      stripe_transfer_id = p_stripe_transfer_id,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id IN (
    SELECT royalty_transaction_id FROM payout_items
    WHERE payout_id = p_payout_id AND NOT voided
  )
  AND status = 'reserved';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE payouts
  SET status = 'paid',
      stripe_transfer_id = p_stripe_transfer_id,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payout_id
    AND status IN ('pending', 'processing');

  RETURN v_updated;
END;
$$;

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
  v_status TEXT;
BEGIN
  SELECT status INTO v_status FROM payouts WHERE id = p_payout_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Payout % does not exist', p_payout_id;
  END IF;

  -- Releasing a paid payout would strip the audit trail from a transfer that
  -- actually happened.
  IF v_status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Payout % is % and cannot be released', p_payout_id, v_status;
  END IF;

  UPDATE sale_royalty_transactions
  SET status = 'ready_to_pay', updated_at = NOW()
  WHERE id IN (
    SELECT royalty_transaction_id FROM payout_items
    WHERE payout_id = p_payout_id AND NOT voided
  )
  AND status = 'reserved';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Void rather than delete: keeps the record of what this payout attempted while
  -- freeing the transactions for a future payout via the partial unique index.
  UPDATE payout_items
  SET voided = TRUE
  WHERE payout_id = p_payout_id;

  UPDATE payouts
  SET status = 'failed',
      failed_reason = COALESCE(p_failed_reason, failed_reason),
      updated_at = NOW()
  WHERE id = p_payout_id
    AND status IN ('pending', 'processing');

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.request_payout(UUID, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_payout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_payout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
