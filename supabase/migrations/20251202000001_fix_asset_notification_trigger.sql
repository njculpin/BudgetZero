-- Fix Asset Notification Trigger
-- The original trigger referenced a non-existent field royalty_fixed_total
-- This migration drops the broken trigger and creates a corrected version

-- ============================================
-- 1. DROP BROKEN TRIGGER AND FUNCTION
-- ============================================

-- Drop all potential trigger names that might exist
DROP TRIGGER IF EXISTS notify_products_on_asset_change ON public.assets;
DROP TRIGGER IF EXISTS notify_products_on_asset_update ON public.assets;

-- Now drop the function (CASCADE will drop any remaining triggers)
DROP FUNCTION IF EXISTS public.notify_products_of_asset_changes() CASCADE;

-- ============================================
-- 2. CREATE CORRECTED TRIGGER FUNCTION
-- ============================================

-- This trigger monitors asset_files changes instead of a non-existent price field
-- Products will be notified when asset files are added/removed/changed
CREATE OR REPLACE FUNCTION public.notify_products_of_asset_file_changes()
RETURNS TRIGGER AS $$
DECLARE
  affected_product RECORD;
  notification_count INTEGER := 0;
  change_description TEXT;
  asset_title TEXT;
BEGIN
  -- Get asset title
  SELECT title INTO asset_title FROM public.assets WHERE id = NEW.asset_id;

  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_description := format('New file "%s" added to asset "%s"', NEW.title, asset_title);
  ELSIF TG_OP = 'UPDATE' THEN
    change_description := format('File "%s" updated in asset "%s"', NEW.title, asset_title);
  ELSIF TG_OP = 'DELETE' THEN
    change_description := format('File "%s" removed from asset "%s"', OLD.title, asset_title);
  END IF;

  -- Find all products using this asset (for INSERT/UPDATE use NEW, for DELETE use OLD)
  FOR affected_product IN
    SELECT DISTINCT
      p.id,
      p.user_id,
      p.title,
      p.handle
    FROM public.products p
    JOIN public.product_variants pv ON p.id = pv.product_id
    JOIN public.product_assets pa ON pv.id = pa.variant_id
    WHERE pa.asset_id = COALESCE(NEW.asset_id, OLD.asset_id)
      AND p.deleted = FALSE
      AND pv.deleted = FALSE
  LOOP
    -- Create notification for product owner
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      entity_type,
      entity_id,
      action_type,
      snapshot,
      delivery_type,
      read
    ) VALUES (
      affected_product.user_id,
      'Asset File Changed',
      change_description || '. Review your product "' || affected_product.title || '" to ensure it still meets your requirements.',
      'product',
      affected_product.id,
      'asset_files_changed',
      jsonb_build_object(
        'product_id', affected_product.id,
        'product_handle', affected_product.handle,
        'product_title', affected_product.title,
        'asset_id', COALESCE(NEW.asset_id, OLD.asset_id),
        'asset_title', asset_title,
        'file_title', COALESCE(NEW.title, OLD.title),
        'change_type', TG_OP
      ),
      'inapp',
      FALSE
    );

    notification_count := notification_count + 1;
  END LOOP;

  -- Log the change
  INSERT INTO public.asset_change_log (
    asset_id,
    changed_by_user_id,
    change_type,
    old_value,
    new_value,
    affected_products_count,
    notifications_sent
  ) VALUES (
    COALESCE(NEW.asset_id, OLD.asset_id),
    COALESCE(NEW.asset_id, OLD.asset_id), -- We don't have user_id in trigger context
    'files',
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    notification_count,
    notification_count
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_products_of_asset_file_changes IS 'Notifies product owners when asset files are added, updated, or removed';

-- ============================================
-- 3. CREATE TRIGGER ON ASSET_FILES
-- ============================================

CREATE TRIGGER notify_products_on_asset_file_change
  AFTER INSERT OR UPDATE OR DELETE ON public.asset_files
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_products_of_asset_file_changes();

COMMENT ON TRIGGER notify_products_on_asset_file_change ON public.asset_files IS 'Triggers notifications when asset files change';

-- ============================================
-- 4. CREATE ROYALTY CHANGE TRIGGER
-- ============================================

-- Monitor asset_royalties table for price changes
CREATE OR REPLACE FUNCTION public.notify_products_of_royalty_changes()
RETURNS TRIGGER AS $$
DECLARE
  affected_product RECORD;
  notification_count INTEGER := 0;
  change_description TEXT;
  asset_title TEXT;
  total_fixed_royalties NUMERIC := 0;
  product_price NUMERIC;
BEGIN
  -- Only process updates and inserts
  IF TG_OP NOT IN ('UPDATE', 'INSERT') THEN
    RETURN NEW;
  END IF;

  -- Get asset title
  SELECT title INTO asset_title FROM public.assets WHERE id = NEW.asset_id;

  -- Build change description
  IF TG_OP = 'INSERT' THEN
    change_description := format('New royalty added to asset "%s": %s %s',
      asset_title,
      NEW.royalty_value,
      CASE WHEN NEW.royalty_type = 'fixed' THEN 'USD' ELSE '%' END
    );
  ELSIF TG_OP = 'UPDATE' AND (OLD.royalty_value IS DISTINCT FROM NEW.royalty_value OR OLD.royalty_type IS DISTINCT FROM NEW.royalty_type) THEN
    change_description := format('Royalty changed for asset "%s": from %s to %s',
      asset_title,
      OLD.royalty_value,
      NEW.royalty_value
    );
  ELSE
    -- No meaningful change
    RETURN NEW;
  END IF;

  -- Find all products using this asset
  FOR affected_product IN
    SELECT DISTINCT
      p.id,
      p.user_id,
      p.title,
      p.handle,
      ppv.price
    FROM public.products p
    JOIN public.product_variants pv ON p.id = pv.product_id
    JOIN public.product_assets pa ON pv.id = pa.variant_id
    JOIN public.product_variant_prices ppv ON pv.id = ppv.variant_id
    WHERE pa.asset_id = NEW.asset_id
      AND p.deleted = FALSE
      AND pv.deleted = FALSE
      AND ppv.deleted = FALSE
  LOOP
    -- Calculate total fixed royalties for all assets in this product
    SELECT COALESCE(SUM(ar.royalty_value), 0)
    INTO total_fixed_royalties
    FROM public.product_variants pv
    JOIN public.product_assets pa ON pv.id = pa.variant_id
    JOIN public.asset_royalties ar ON pa.asset_id = ar.asset_id
    WHERE pv.product_id = affected_product.id
      AND ar.royalty_type = 'fixed'
      AND ar.deleted = FALSE;

    -- Check if total royalties exceed product price (conflict)
    IF total_fixed_royalties > affected_product.price THEN
      -- Mark product as needing attention and take it offline
      UPDATE public.products
      SET
        status = 'draft',
        needs_attention = TRUE,
        attention_reason = format('Asset royalty costs ($%s) exceed product price ($%s)', total_fixed_royalties, affected_product.price),
        attention_since = NOW()
      WHERE id = affected_product.id;

      -- Create conflict notification
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        entity_type,
        entity_id,
        action_type,
        snapshot,
        delivery_type,
        read
      ) VALUES (
        affected_product.user_id,
        'Product Price Conflict',
        format('Your product "%s" has been taken offline. Asset royalties ($%s) now exceed your product price ($%s). Please review and update pricing.',
          affected_product.title,
          total_fixed_royalties,
          affected_product.price
        ),
        'product',
        affected_product.id,
        'product_price_conflict',
        jsonb_build_object(
          'product_id', affected_product.id,
          'product_handle', affected_product.handle,
          'product_title', affected_product.title,
          'product_price', affected_product.price,
          'total_royalties', total_fixed_royalties,
          'asset_id', NEW.asset_id,
          'asset_title', asset_title
        ),
        'inapp',
        FALSE
      );
    ELSE
      -- Just notify about the change, no conflict
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        entity_type,
        entity_id,
        action_type,
        snapshot,
        delivery_type,
        read
      ) VALUES (
        affected_product.user_id,
        'Asset Royalty Changed',
        change_description || '. This affects your product "' || affected_product.title || '". Please review your pricing.',
        'product',
        affected_product.id,
        'asset_royalties_changed',
        jsonb_build_object(
          'product_id', affected_product.id,
          'product_handle', affected_product.handle,
          'product_title', affected_product.title,
          'asset_id', NEW.asset_id,
          'asset_title', asset_title,
          'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.royalty_value ELSE NULL END,
          'new_value', NEW.royalty_value
        ),
        'inapp',
        FALSE
      );
    END IF;

    notification_count := notification_count + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_products_of_royalty_changes IS 'Notifies product owners when asset royalties change and checks for pricing conflicts';

-- ============================================
-- 5. CREATE TRIGGER ON ASSET_ROYALTIES
-- ============================================

CREATE TRIGGER notify_products_on_royalty_change
  AFTER INSERT OR UPDATE ON public.asset_royalties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_products_of_royalty_changes();

COMMENT ON TRIGGER notify_products_on_royalty_change ON public.asset_royalties IS 'Triggers notifications and conflict checks when royalties change';
