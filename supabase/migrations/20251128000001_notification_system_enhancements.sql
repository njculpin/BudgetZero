-- Notification System Enhancements
-- Adds notification settings, action types, and asset change tracking

-- ============================================
-- 1. ADD ACTION TYPE TO NOTIFICATIONS
-- ============================================

-- Add action_type column to notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS action_type TEXT;

-- Add check constraint for action_type
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_action_type_check
CHECK (action_type IN (
  'asset_price_changed',
  'asset_files_changed',
  'asset_royalties_changed',
  'product_needs_review',
  'product_price_conflict',
  'sale_completed',
  'royalty_payment_received',
  'document_shared',
  'jam_submission_approved',
  'general'
));

-- Create index for action_type
CREATE INDEX IF NOT EXISTS notifications_action_type_idx ON public.notifications(action_type);

COMMENT ON COLUMN public.notifications.action_type IS 'Type of action that triggered the notification';

-- ============================================
-- 2. NOTIFICATION SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Email notification preferences
  email_asset_changes BOOLEAN NOT NULL DEFAULT TRUE,
  email_product_conflicts BOOLEAN NOT NULL DEFAULT TRUE,
  email_sales BOOLEAN NOT NULL DEFAULT TRUE,
  email_royalty_payments BOOLEAN NOT NULL DEFAULT TRUE,
  email_document_shares BOOLEAN NOT NULL DEFAULT TRUE,
  email_jam_updates BOOLEAN NOT NULL DEFAULT FALSE,
  email_marketing BOOLEAN NOT NULL DEFAULT FALSE,

  -- In-app notification preferences
  inapp_asset_changes BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_product_conflicts BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_sales BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_royalty_payments BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_document_shares BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_jam_updates BOOLEAN NOT NULL DEFAULT TRUE,

  -- Push notification preferences (future use)
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_sales BOOLEAN NOT NULL DEFAULT FALSE,
  push_royalty_payments BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

COMMENT ON TABLE public.notification_settings IS 'User preferences for notification delivery methods';

-- Create index
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON public.notification_settings(user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_notification_settings
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. PRODUCT CONFLICT TRACKING
-- ============================================

-- Add fields to products table to track when they need attention
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS attention_reason TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS attention_since TIMESTAMPTZ;

-- Create index for products needing attention
CREATE INDEX IF NOT EXISTS products_needs_attention_idx ON public.products(needs_attention, user_id)
WHERE needs_attention = TRUE;

COMMENT ON COLUMN public.products.needs_attention IS 'True when product requires owner review due to asset changes';
COMMENT ON COLUMN public.products.attention_reason IS 'Explanation of why product needs attention (e.g., asset price increased)';
COMMENT ON COLUMN public.products.attention_since IS 'Timestamp when product was flagged for attention';

-- ============================================
-- 4. ASSET CHANGE AUDIT TABLE
-- ============================================

-- Track asset changes to help with notification logic
CREATE TABLE IF NOT EXISTS public.asset_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  changed_by_user_id UUID NOT NULL REFERENCES public.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('price', 'files', 'royalties', 'status', 'metadata')),
  old_value JSONB,
  new_value JSONB,
  affected_products_count INTEGER NOT NULL DEFAULT 0,
  notifications_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.asset_change_log IS 'Audit log of asset changes that affect products';

CREATE INDEX IF NOT EXISTS asset_change_log_asset_id_idx ON public.asset_change_log(asset_id);
CREATE INDEX IF NOT EXISTS asset_change_log_changed_by_idx ON public.asset_change_log(changed_by_user_id);
CREATE INDEX IF NOT EXISTS asset_change_log_change_type_idx ON public.asset_change_log(change_type);
CREATE INDEX IF NOT EXISTS asset_change_log_created_at_idx ON public.asset_change_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.asset_change_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Service role can manage asset change log"
  ON public.asset_change_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 5. FUNCTION: DETECT ASSET CHANGES AND NOTIFY
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_products_of_asset_changes()
RETURNS TRIGGER AS $$
DECLARE
  affected_product RECORD;
  notification_count INTEGER := 0;
  change_description TEXT;
  royalty_total NUMERIC;
  product_price NUMERIC;
BEGIN
  -- Only process updates, not inserts/deletes
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if royalty_fixed_total changed (price change)
  IF OLD.royalty_fixed_total IS DISTINCT FROM NEW.royalty_fixed_total THEN
    change_description := format(
      'Asset "%s" price changed from $%s to $%s',
      NEW.title,
      OLD.royalty_fixed_total,
      NEW.royalty_fixed_total
    );

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
      WHERE pa.asset_id = NEW.id
        AND p.deleted = FALSE
        AND pv.deleted = FALSE
        AND ppv.deleted = FALSE
    LOOP
      -- Calculate total asset costs for this product
      SELECT COALESCE(SUM(a.royalty_fixed_total), 0)
      INTO royalty_total
      FROM public.product_variants pv
      JOIN public.product_assets pa ON pv.id = pa.variant_id
      JOIN public.assets a ON pa.asset_id = a.id
      WHERE pv.product_id = affected_product.id
        AND a.deleted = FALSE;

      -- Check if asset cost exceeds product price (conflict)
      IF royalty_total > affected_product.price THEN
        -- Mark product as needing attention
        UPDATE public.products
        SET
          needs_attention = TRUE,
          status = 'draft', -- Take product offline
          attention_reason = format(
            'Asset costs ($%s) exceed product price ($%s). Asset "%s" price increased.',
            royalty_total,
            affected_product.price,
            NEW.title
          ),
          attention_since = NOW()
        WHERE id = affected_product.id;

        -- Create notification for product owner
        INSERT INTO public.notifications (
          user_id,
          title,
          message,
          entity_type,
          entity_id,
          action_type,
          delivery_type,
          snapshot
        ) VALUES (
          affected_product.user_id,
          'Product Conflict: Price Issue',
          format(
            'Your product "%s" has been taken offline. %s The total asset costs ($%s) now exceed your product price ($%s). Please review and update pricing.',
            affected_product.title,
            change_description,
            royalty_total,
            affected_product.price
          ),
          'product',
          affected_product.id,
          'product_price_conflict',
          'inapp',
          jsonb_build_object(
            'product_handle', affected_product.handle,
            'product_title', affected_product.title,
            'asset_id', NEW.id,
            'asset_title', NEW.title,
            'old_asset_price', OLD.royalty_fixed_total,
            'new_asset_price', NEW.royalty_fixed_total,
            'total_asset_costs', royalty_total,
            'product_price', affected_product.price
          )
        );

        notification_count := notification_count + 1;
      ELSE
        -- Price changed but no conflict - just notify
        UPDATE public.products
        SET
          needs_attention = TRUE,
          attention_reason = format(
            'Asset "%s" price changed from $%s to $%s. Please review product pricing.',
            NEW.title,
            OLD.royalty_fixed_total,
            NEW.royalty_fixed_total
          ),
          attention_since = NOW()
        WHERE id = affected_product.id;

        INSERT INTO public.notifications (
          user_id,
          title,
          message,
          entity_type,
          entity_id,
          action_type,
          delivery_type,
          snapshot
        ) VALUES (
          affected_product.user_id,
          'Asset Price Changed',
          format(
            'Asset "%s" used in your product "%s" has a new price: $%s (was $%s). Please review your product to ensure pricing is still correct.',
            NEW.title,
            affected_product.title,
            NEW.royalty_fixed_total,
            OLD.royalty_fixed_total
          ),
          'product',
          affected_product.id,
          'asset_price_changed',
          'inapp',
          jsonb_build_object(
            'product_handle', affected_product.handle,
            'product_title', affected_product.title,
            'asset_id', NEW.id,
            'asset_title', NEW.title,
            'old_asset_price', OLD.royalty_fixed_total,
            'new_asset_price', NEW.royalty_fixed_total
          )
        );

        notification_count := notification_count + 1;
      END IF;
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
      NEW.id,
      NEW.user_id,
      'price',
      jsonb_build_object('royalty_fixed_total', OLD.royalty_fixed_total),
      jsonb_build_object('royalty_fixed_total', NEW.royalty_fixed_total),
      (SELECT COUNT(DISTINCT p.id)
       FROM public.products p
       JOIN public.product_variants pv ON p.id = pv.product_id
       JOIN public.product_assets pa ON pv.id = pa.variant_id
       WHERE pa.asset_id = NEW.id
         AND p.deleted = FALSE
         AND pv.deleted = FALSE),
      notification_count
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_products_of_asset_changes() IS 'Detects asset price changes and notifies product owners, taking products offline if conflicts exist';

-- ============================================
-- 6. CREATE TRIGGER ON ASSETS TABLE
-- ============================================

DROP TRIGGER IF EXISTS notify_products_on_asset_update ON public.assets;

CREATE TRIGGER notify_products_on_asset_update
  AFTER UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_products_of_asset_changes();

COMMENT ON TRIGGER notify_products_on_asset_update ON public.assets IS 'Triggers notification system when assets are updated';

-- ============================================
-- 7. FUNCTION: RESOLVE PRODUCT CONFLICT
-- ============================================

CREATE OR REPLACE FUNCTION public.resolve_product_conflict(
  p_product_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  product_owner UUID;
BEGIN
  -- Verify user owns this product
  SELECT user_id INTO product_owner
  FROM public.products
  WHERE id = p_product_id;

  IF product_owner != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- Clear attention flags
  UPDATE public.products
  SET
    needs_attention = FALSE,
    attention_reason = NULL,
    attention_since = NULL
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.resolve_product_conflict IS 'Marks a product conflict as resolved by the product owner';

-- ============================================
-- 8. HELPER FUNCTION: CREATE DEFAULT NOTIFICATION SETTINGS
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create notification settings for new users
DROP TRIGGER IF EXISTS create_notification_settings_on_user_create ON public.users;

CREATE TRIGGER create_notification_settings_on_user_create
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_settings();

COMMENT ON FUNCTION public.create_default_notification_settings IS 'Automatically creates default notification settings for new users';
