-- Fix Asset Change Log User ID Issue
-- The trigger was incorrectly using asset_id instead of user_id for changed_by_user_id

-- ============================================
-- 1. UPDATE ASSET FILE CHANGE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_products_of_asset_file_changes()
RETURNS TRIGGER AS $$
DECLARE
  affected_product RECORD;
  notification_count INTEGER := 0;
  change_description TEXT;
  asset_title TEXT;
  asset_owner_id UUID;
BEGIN
  -- Get asset title and owner
  SELECT title, user_id
  INTO asset_title, asset_owner_id
  FROM public.assets
  WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);

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

  -- Log the change with correct user_id (asset owner)
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
    asset_owner_id, -- Fixed: Use asset owner's user_id instead of asset_id
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
