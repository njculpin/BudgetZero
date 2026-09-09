-- Atomic credits balance mutation
--
-- Credits were spent and granted with a read-modify-write in JS:
--
--   const user = await getUserById(userId);
--   if (user.credits_balance < total) { reject }
--   await updateUserCreditsBalance(userId, user.credits_balance - total);
--
-- Two concurrent checkouts both read the same balance, both pass the check, and
-- both write a balance computed from the stale value — so a buyer could spend the
-- same credits twice. The rollback path had the same flaw: restoring the balance to
-- the value read at the start of the request discards any concurrent change.
--
-- These functions make the check and the decrement a single statement, so the
-- database enforces sufficiency.

-- Spend credits. Returns the new balance, or NULL when the balance is insufficient.
-- The `credits_balance >= p_amount_cents` predicate is what makes the check atomic:
-- if the row no longer satisfies it, no row is updated and nothing is returned.
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id UUID,
  p_amount_cents INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  UPDATE users
  SET credits_balance = credits_balance - p_amount_cents,
      updated_at = NOW()
  WHERE id = p_user_id
    AND credits_balance >= p_amount_cents
  RETURNING credits_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.spend_credits IS
  'Atomically deduct credits. Returns the new balance, or NULL if insufficient.';

-- Grant credits. Used both to pay contributors and to reverse a failed purchase.
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id UUID,
  p_amount_cents INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  UPDATE users
  SET credits_balance = credits_balance + p_amount_cents,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.grant_credits IS
  'Atomically add credits to a user balance.';

-- A balance must never go negative, whatever path writes it.
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_credits_balance_non_negative;

ALTER TABLE public.users
  ADD CONSTRAINT users_credits_balance_non_negative
  CHECK (credits_balance >= 0);

REVOKE ALL ON FUNCTION public.spend_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
