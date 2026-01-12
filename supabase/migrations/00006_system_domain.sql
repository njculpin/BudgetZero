-- System Domain
-- Notifications, notification settings, storage buckets, logs, sessions, licenses, and activity feed

-- ============================================
-- 1. LICENSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  agreement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(title, version)
);

COMMENT ON TABLE public.licenses IS 'License templates for product usage rights (e.g., CC-BY, Commercial)';

-- ============================================
-- 2. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'document', 'product', 'sale')),
  entity_id UUID NOT NULL,
  action_type TEXT CHECK (action_type IN (
    'product_needs_review',
    'product_price_conflict',
    'sale_completed',
    'royalty_payment_received',
    'document_shared',
    'general'
  )),
  snapshot JSONB NOT NULL DEFAULT '{}',
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('push', 'email', 'inapp')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.notifications IS 'User notifications for platform events';
COMMENT ON COLUMN public.notifications.action_type IS 'Type of action that triggered the notification';

-- ============================================
-- 3. NOTIFICATION SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Email notification preferences
  email_product_conflicts BOOLEAN NOT NULL DEFAULT TRUE,
  email_sales BOOLEAN NOT NULL DEFAULT TRUE,
  email_royalty_payments BOOLEAN NOT NULL DEFAULT TRUE,
  email_document_shares BOOLEAN NOT NULL DEFAULT TRUE,
  email_marketing BOOLEAN NOT NULL DEFAULT FALSE,

  -- In-app notification preferences
  inapp_product_conflicts BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_sales BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_royalty_payments BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_document_shares BOOLEAN NOT NULL DEFAULT TRUE,

  -- Push notification preferences (future use)
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_sales BOOLEAN NOT NULL DEFAULT FALSE,
  push_royalty_payments BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

COMMENT ON TABLE public.notification_settings IS 'User preferences for notification delivery methods';

-- ============================================
-- 4. ACTIVITY FEED
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'document', 'product', 'sale')),
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'public', 'purchased', 'reviewed')),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activity_feed IS 'Global activity stream for public actions';

-- ============================================
-- 5. SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.sessions IS 'Application session tokens';

-- ============================================
-- 6. VERIFICATION TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.verification_tokens IS 'Email verification and password reset tokens';

-- ============================================
-- 7. STRIPE WEBHOOK EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stripe_webhook_events IS 'Stripe webhook event tracking for idempotency';

-- ============================================
-- 8. AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Tracks all admin actions for security and compliance';

-- ============================================
-- 9. LOG EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'document', 'product', 'sale')),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.log_events IS 'Application-level logging for debugging';

-- ============================================
-- 10. INDEXES
-- ============================================

-- Licenses indexes
CREATE INDEX IF NOT EXISTS licenses_title_idx ON public.licenses(title);
CREATE INDEX IF NOT EXISTS licenses_version_idx ON public.licenses(version);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_entity_type_idx ON public.notifications(entity_type);
CREATE INDEX IF NOT EXISTS notifications_action_type_idx ON public.notifications(action_type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Notification settings indexes
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON public.notification_settings(user_id);

-- Activity feed indexes
CREATE INDEX IF NOT EXISTS activity_feed_user_id_idx ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS activity_feed_entity_type_idx ON public.activity_feed(entity_type);
CREATE INDEX IF NOT EXISTS activity_feed_action_type_idx ON public.activity_feed(action_type);
CREATE INDEX IF NOT EXISTS activity_feed_created_at_idx ON public.activity_feed(created_at DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON public.sessions(token);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON public.sessions(expires_at);

-- Verification tokens indexes
CREATE INDEX IF NOT EXISTS verification_tokens_user_id_idx ON public.verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON public.verification_tokens(token);
CREATE INDEX IF NOT EXISTS verification_tokens_type_idx ON public.verification_tokens(type);
CREATE INDEX IF NOT EXISTS verification_tokens_expires_at_idx ON public.verification_tokens(expires_at);

-- Stripe webhook events indexes
CREATE INDEX IF NOT EXISTS stripe_webhook_events_stripe_event_id_idx ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_processed_idx ON public.stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_created_at_idx ON public.stripe_webhook_events(created_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx ON public.audit_log(resource_type, resource_id);

-- Log events indexes
CREATE INDEX IF NOT EXISTS log_events_entity_type_idx ON public.log_events(entity_type);
CREATE INDEX IF NOT EXISTS log_events_created_at_idx ON public.log_events(created_at DESC);

-- ============================================
-- 11. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_licenses
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_notifications
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_notification_settings
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_activity_feed
  BEFORE UPDATE ON public.activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sessions
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_verification_tokens
  BEFORE UPDATE ON public.verification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_stripe_webhook_events
  BEFORE UPDATE ON public.stripe_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_log_events
  BEFORE UPDATE ON public.log_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create notification settings for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_default_notification_settings IS 'Automatically creates default notification settings for new users';

CREATE TRIGGER create_notification_settings_on_user_create
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_settings();

-- ============================================
-- 12. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for licenses
CREATE POLICY "Licenses are publicly viewable"
  ON public.licenses FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Service role can manage licenses"
  ON public.licenses FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for notification_settings
CREATE POLICY "Users can view own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity_feed
CREATE POLICY "Activity feed is publicly viewable"
  ON public.activity_feed FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can manage activity feed"
  ON public.activity_feed FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON public.sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for verification_tokens
CREATE POLICY "Users can view own verification tokens"
  ON public.verification_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verification tokens"
  ON public.verification_tokens FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for stripe_webhook_events
CREATE POLICY "Service role can manage webhook events"
  ON public.stripe_webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for log_events
CREATE POLICY "Service role can manage log events"
  ON public.log_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 13. STORAGE BUCKETS
-- ============================================

-- Product files bucket (for downloadable product files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Product images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 14. STORAGE RLS POLICIES
-- ============================================

-- Product-files bucket policies (private - requires purchase to download)
CREATE POLICY "Authenticated users can upload product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "Service role can manage product files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'product-files');

-- Product-images bucket policies (public)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- User-avatars bucket policies (public)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Anyone can view user avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars');
