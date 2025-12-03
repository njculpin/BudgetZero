-- System Domain
-- Notifications, storage buckets, logs, sessions, licenses, and activity feed

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

COMMENT ON TABLE public.licenses IS 'License templates for asset usage rights (e.g., CC-BY, Commercial)';

-- ============================================
-- 2. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'asset', 'document', 'product', 'sale')),
  entity_id UUID NOT NULL,
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

-- ============================================
-- 3. ACTIVITY FEED
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'asset', 'document', 'product', 'sale', 'jam')),
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'public', 'purchased', 'reviewed')),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activity_feed IS 'Global activity stream for public actions';

-- ============================================
-- 4. SESSIONS
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
-- 5. VERIFICATION TOKENS
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
-- 6. STRIPE WEBHOOK EVENTS
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
-- 7. AUDIT LOG
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
-- 8. LOG EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'asset', 'document', 'product', 'sale')),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.log_events IS 'Application-level logging for debugging';

-- ============================================
-- 9. INDEXES
-- ============================================

-- Licenses indexes
CREATE INDEX IF NOT EXISTS licenses_title_idx ON public.licenses(title);
CREATE INDEX IF NOT EXISTS licenses_version_idx ON public.licenses(version);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_entity_type_idx ON public.notifications(entity_type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

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
-- 10. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_licenses
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_notifications
  BEFORE UPDATE ON public.notifications
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

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
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
-- 12. STORAGE BUCKETS
-- ============================================

-- Asset files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-files', 'asset-files', true)
ON CONFLICT (id) DO NOTHING;

-- Asset images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-images', 'asset-images', true)
ON CONFLICT (id) DO NOTHING;

-- Product images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Jam images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('jam-images', 'jam-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 13. STORAGE RLS POLICIES
-- ============================================

-- Asset-files bucket policies
CREATE POLICY "Users can upload files to their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'asset-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view files for public assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-files');

CREATE POLICY "Users can update their own asset files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'asset-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own asset files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'asset-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Asset-images bucket policies
CREATE POLICY "Users can upload images to their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'asset-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view asset images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-images');

CREATE POLICY "Users can update their own asset images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'asset-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own asset images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'asset-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Product-images bucket policies
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
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- User-avatars bucket policies
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view user avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Jam-images bucket policies
CREATE POLICY "Authenticated users can upload jam images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jam-images');

CREATE POLICY "Anyone can view jam images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'jam-images');

CREATE POLICY "Users can update own jam images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'jam-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own jam images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'jam-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 14. ENABLE REALTIME
-- ============================================

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_chat_messages;
