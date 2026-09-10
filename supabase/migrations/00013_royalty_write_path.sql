-- The royalty write path
--
-- `product_royalties` is the table every royalty feature reads: contributor
-- credits, the revenue preview, the earnings dashboard, payout balances, and
-- `createRoyaltyTransactionsForProduct` — which returns an empty array and creates
-- nothing when a product has no royalty rows.
--
-- Nothing in the application ever wrote to it. `createProductRoyalty` existed in
-- two places and was called from neither. Embedding wrote only a
-- `product_components` row. So no royalty was ever paid to anyone, and the
-- platform's entire differentiator was inert.
--
-- The fix keeps the royalty attached to the CHILD product rather than to each
-- embed relationship, because that is where the webhook looks it up: for every
-- component of a sold product it calls
-- createRoyaltyTransactionsForProduct(child_product_id). One row per embeddable
-- product, owned by that product's creator.

-- ============================================
-- 0. THE COLUMN THE RATE WAS SUPPOSED TO LIVE IN
-- ============================================

-- `products.embedding_royalty_cents` never existed. The December consolidation
-- dropped it while `Product` kept declaring it — and because the field is
-- OPTIONAL on the type, TypeScript never objected.
--
-- So ProductEmbeddableToggle collected a rate, promised the creator "You'll earn
-- $X each time someone purchases a product containing this one", submitted it,
-- and update-product mapped it into an UPDATE against a column that was not
-- there. The rate was never stored. This is the same shape of defect as the
-- phantom `products.price_cents` that stopped Add to Cart rendering.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS embedding_royalty_cents INTEGER NOT NULL DEFAULT 0
  CHECK (embedding_royalty_cents >= 0);

COMMENT ON COLUMN public.products.embedding_royalty_cents IS
  'What this product''s creator earns each time a product embedding it is sold. '
  'Set by the creator; snapshotted into product_components.inherited_price_cents '
  'at embed time so a later change does not reprice existing products.';

-- ============================================
-- 1. KEEP ROYALTIES IN SYNC WITH THE PRODUCT
-- ============================================

-- A trigger rather than application code, so the row cannot drift out of step
-- with `is_embeddable` / `embedding_royalty_cents` no matter which route updates
-- the product — and so it is impossible to add a new update path that forgets.
CREATE OR REPLACE FUNCTION public.sync_product_embedding_royalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_should_exist BOOLEAN;
  v_existing_id UUID;
BEGIN
  v_should_exist :=
    NEW.is_embeddable
    AND COALESCE(NEW.embedding_royalty_cents, 0) > 0
    AND NEW.deleted = FALSE;

  SELECT id INTO v_existing_id
  FROM product_royalties
  WHERE product_id = NEW.id
    AND user_id = NEW.user_id
    AND deleted = FALSE
  LIMIT 1;

  IF v_should_exist THEN
    IF v_existing_id IS NULL THEN
      INSERT INTO product_royalties (product_id, user_id, royalty_type, royalty_value)
      VALUES (NEW.id, NEW.user_id, 'fixed', NEW.embedding_royalty_cents);
    ELSE
      -- Only the rate changes. Existing sale_royalty_transactions denormalise
      -- royalty_value at sale time, so history is unaffected by an edit here.
      UPDATE product_royalties
      SET royalty_value = NEW.embedding_royalty_cents,
          updated_at = NOW()
      WHERE id = v_existing_id
        AND royalty_value IS DISTINCT FROM NEW.embedding_royalty_cents;
    END IF;
  ELSIF v_existing_id IS NOT NULL THEN
    -- Soft delete: the creator has stopped offering this product for embedding,
    -- or zeroed the rate. Existing components keep working — they were priced at
    -- embed time — but no NEW royalty accrues.
    UPDATE product_royalties
    SET deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
    WHERE id = v_existing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_embedding_royalty ON public.products;

CREATE TRIGGER trg_sync_product_embedding_royalty
AFTER INSERT OR UPDATE OF is_embeddable, embedding_royalty_cents, user_id, deleted
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_embedding_royalty();

COMMENT ON FUNCTION public.sync_product_embedding_royalty IS
  'Maintains one product_royalties row per embeddable product, paying that '
  'product''s owner. This is the write path that was entirely missing.';

-- Backfill anything already marked embeddable with a rate.
INSERT INTO product_royalties (product_id, user_id, royalty_type, royalty_value)
SELECT p.id, p.user_id, 'fixed', p.embedding_royalty_cents
FROM products p
WHERE p.is_embeddable
  AND COALESCE(p.embedding_royalty_cents, 0) > 0
  AND p.deleted = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM product_royalties pr
    WHERE pr.product_id = p.id AND pr.user_id = p.user_id AND pr.deleted = FALSE
  );

-- ============================================
-- 2. EMBEDDING DERIVES ITS PRICE SERVER-SIDE
-- ============================================

-- `inherited_price_cents` came from the client request body, so the party doing
-- the embedding set the price of someone else's work — and could set it to zero.
-- Against the 3D Modeller persona's stated pain, race-to-bottom pricing, the
-- platform handed price control to the buyer of that labour.
--
-- Doing this in SQL also lets the component row and its validation share one
-- transaction, and closes the cycle check the API never had.
CREATE OR REPLACE FUNCTION public.embed_product(
  p_parent_product_id UUID,
  p_child_product_id UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (component_id UUID, inherited_price_cents INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent RECORD;
  v_child RECORD;
  v_component_id UUID;
  v_price INTEGER;
BEGIN
  IF p_parent_product_id = p_child_product_id THEN
    RAISE EXCEPTION 'A product cannot embed itself' USING ERRCODE = 'P0001';
  END IF;

  SELECT id, user_id INTO v_parent
  FROM products WHERE id = p_parent_product_id AND deleted = FALSE;

  IF v_parent.id IS NULL THEN
    RAISE EXCEPTION 'Parent product not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_parent.user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'You do not own the parent product' USING ERRCODE = 'P0003';
  END IF;

  SELECT id, user_id, status, is_embeddable, embedding_royalty_cents
  INTO v_child
  FROM products WHERE id = p_child_product_id AND deleted = FALSE;

  IF v_child.id IS NULL THEN
    RAISE EXCEPTION 'Product to embed not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_child.is_embeddable THEN
    RAISE EXCEPTION 'This product is not available for embedding'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_child.status <> 'public' AND v_child.user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'You do not have access to embed this product'
      USING ERRCODE = 'P0003';
  END IF;

  -- Reject a cycle. A embeds B while B already embeds A would make price and
  -- royalty calculation recurse without terminating.
  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = p_child_product_id
      AND child_product_id = p_parent_product_id
      AND deleted = FALSE
  ) THEN
    RAISE EXCEPTION 'That product already embeds this one' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = p_parent_product_id
      AND child_product_id = p_child_product_id
      AND deleted = FALSE
  ) THEN
    RAISE EXCEPTION 'This product is already embedded' USING ERRCODE = 'P0001';
  END IF;

  -- The child's creator sets their own price. Snapshotted here so a later change
  -- to their rate does not silently reprice products already built on it.
  v_price := COALESCE(v_child.embedding_royalty_cents, 0);

  INSERT INTO product_components (
    parent_product_id, child_product_id, inherited_price_cents
  )
  VALUES (p_parent_product_id, p_child_product_id, v_price)
  RETURNING id INTO v_component_id;

  RETURN QUERY SELECT v_component_id, v_price;
END;
$$;

COMMENT ON FUNCTION public.embed_product IS
  'Embed a product, pricing it from the CHILD creator''s configured rate rather '
  'than from client input. Rejects self-embedding, cycles, and duplicates.';

REVOKE ALL ON FUNCTION public.embed_product(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_product_embedding_royalty() FROM PUBLIC, anon, authenticated;
