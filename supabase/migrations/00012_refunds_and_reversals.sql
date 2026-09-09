-- Refund and reversal handling
--
-- Four silent-loss paths, all of which end with the platform's records and the
-- money disagreeing and nobody being told.

-- ============================================
-- 1. PARTIAL REFUNDS
-- ============================================

-- `charge.refunded` fires for partial refunds too, and Stripe reports the running
-- total in `amount_refunded`. The handler ignored it and treated every refund as
-- total, so a $1 goodwill refund on a $50 order voided the creator's entire
-- royalty. There was also nowhere to record a partial amount.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS refunded_cents INTEGER NOT NULL DEFAULT 0
  CHECK (refunded_cents >= 0);

COMMENT ON COLUMN public.sales.refunded_cents IS
  'Running total refunded, from Stripe charge.amount_refunded. Equal to '
  'price_cents for a full refund, less for a partial one.';

-- 'partially_refunded' distinguishes a sale that is still largely valid from one
-- that has been fully reversed. Entitlement is deliberately unaffected: revoking
-- downloads over a partial refund would punish a customer the platform chose to
-- compensate.
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_status_check;

ALTER TABLE public.sales
  ADD CONSTRAINT sales_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- ============================================
-- 2. TRANSFER REVERSALS
-- ============================================

-- Stripe can reverse a transfer after the fact. That money leaves the creator's
-- account and returns to the platform, but nothing here handled the event: the
-- payout stayed 'paid', the royalties stayed 'paid', and the creator's balance was
-- permanently wrong in the platform's favour with no alert.
ALTER TABLE public.payouts
  DROP CONSTRAINT IF EXISTS payouts_status_check;

ALTER TABLE public.payouts
  ADD CONSTRAINT payouts_status_check
  CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'reversed'));

-- Reversal events identify the transfer, not the payout, so the lookup has to go
-- the other way. Unique because two payouts sharing a transfer id would mean the
-- idempotency key had failed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id
  ON public.payouts (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL AND stripe_transfer_id <> '';

-- Reverse a settled payout: the royalties become owed again, and the payout is
-- marked reversed rather than deleted so the history of the transfer survives.
--
-- The royalties return to `ready_to_pay`, which makes them immediately claimable
-- by a new payout. That is correct — the creator genuinely is owed this money
-- again — but it means a reversal caused by a problem with the creator's account
-- will simply recur until someone intervenes. Hence the alert on the caller side.
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
    -- No matching payout. The caller must treat this as an orphan and alert:
    -- money moved that this system has no record of.
    RETURN;
  END IF;

  IF v_payout.status = 'reversed' THEN
    -- Duplicate delivery of the same reversal.
    RETURN QUERY SELECT v_payout.id, 0, v_payout.amount_cents;
    RETURN;
  END IF;

  UPDATE sale_royalty_transactions
  SET status = 'ready_to_pay',
      stripe_transfer_id = NULL,
      paid_at = NULL,
      updated_at = NOW()
  WHERE id IN (
    SELECT pi.royalty_transaction_id FROM payout_items pi
    WHERE pi.payout_id = v_payout.id AND NOT pi.voided
  )
  AND status = 'paid';

  GET DIAGNOSTICS v_restored = ROW_COUNT;

  -- Void the items so those royalties can fund a future payout, while the payout
  -- row itself survives as the record that a transfer happened and came back.
  UPDATE payout_items pi SET voided = TRUE WHERE pi.payout_id = v_payout.id;

  UPDATE payouts
  SET status = 'reversed',
      failed_reason = COALESCE(p_reason, 'Transfer reversed by Stripe'),
      updated_at = NOW()
  WHERE id = v_payout.id;

  RETURN QUERY SELECT v_payout.id, v_restored, v_payout.amount_cents;
END;
$$;

COMMENT ON FUNCTION public.reverse_payout IS
  'Undo a settled payout after Stripe reverses its transfer. Returns no rows when '
  'no payout matches the transfer id — the caller must alert on that.';

-- ============================================
-- 3. REFUNDS THAT LAND MID-PAYOUT
-- ============================================

-- markSaleRoyaltiesAsRefunded moves `reserved` royalties to `refunded`, but the
-- pending payout holding them was left alone: its amount_cents still included
-- them, its payout_items still referenced them, and execute.ts would transfer the
-- original un-reduced amount. release_payout could not clean up afterwards either,
-- because it only restores rows still in 'reserved'.
--
-- Releasing the payout first returns everything to the balance, so the refund can
-- then take out exactly what it should and the creator can request a fresh payout
-- for the remainder.
CREATE OR REPLACE FUNCTION public.release_payouts_for_sale(
  p_sale_id UUID
)
RETURNS TABLE (out_payout_id UUID, out_released_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout_id UUID;
  v_released INTEGER;
BEGIN
  FOR v_payout_id IN
    SELECT DISTINCT pi.payout_id
    FROM payout_items pi
    JOIN sale_royalty_transactions srt
      ON srt.id = pi.royalty_transaction_id
    JOIN payouts p
      ON p.id = pi.payout_id
    WHERE srt.sale_id = p_sale_id
      AND NOT pi.voided
      AND p.status IN ('pending', 'processing')
  LOOP
    SELECT release_payout(
      v_payout_id,
      'Released: a sale funding this payout was refunded'
    ) INTO v_released;

    RETURN QUERY SELECT v_payout_id, v_released;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.release_payouts_for_sale IS
  'Release any pending payout funded by this sale, so a refund cannot be paid out. '
  'Call BEFORE marking the sale''s royalties refunded.';

REVOKE ALL ON FUNCTION public.reverse_payout(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_payouts_for_sale(UUID) FROM PUBLIC, anon, authenticated;
