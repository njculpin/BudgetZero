-- Create social features and system tables
-- Includes: user follows, reviews, tags, notifications, activity feed, licenses

-- ============================================
-- USER SOCIAL FEATURES
-- ============================================

-- Create user_follows table (social following)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create user_tags table
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, value)
);

-- Create user_reviews table
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_rating INTEGER NOT NULL CHECK (review_rating >= 1 AND review_rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, reviewer_id),
  CHECK (user_id != reviewer_id)
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================
-- ACTIVITY FEED
-- ============================================

-- Create activity_feed table (global activity stream)
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'asset', 'document', 'product', 'sale', 'jam')),
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'published', 'purchased', 'reviewed')),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LICENSES SYSTEM
-- ============================================

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
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

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- Create sessions table (application sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create verification_tokens table (email verification, password reset)
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create stripe_webhook_events table (webhook event tracking)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create log_events table (application logging)
CREATE TABLE IF NOT EXISTS log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'asset', 'document', 'product', 'sale')),
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for user_follows
CREATE INDEX IF NOT EXISTS user_follows_follower_id_idx ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_id_idx ON user_follows(following_id);

-- Indexes for user_tags
CREATE INDEX IF NOT EXISTS user_tags_user_id_idx ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS user_tags_value_idx ON user_tags(value);

-- Indexes for user_reviews
CREATE INDEX IF NOT EXISTS user_reviews_user_id_idx ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS user_reviews_reviewer_id_idx ON user_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS user_reviews_rating_idx ON user_reviews(review_rating);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_entity_type_idx ON notifications(entity_type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Indexes for activity_feed
CREATE INDEX IF NOT EXISTS activity_feed_user_id_idx ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS activity_feed_entity_type_idx ON activity_feed(entity_type);
CREATE INDEX IF NOT EXISTS activity_feed_action_type_idx ON activity_feed(action_type);
CREATE INDEX IF NOT EXISTS activity_feed_created_at_idx ON activity_feed(created_at DESC);

-- Indexes for licenses
CREATE INDEX IF NOT EXISTS licenses_title_idx ON licenses(title);
CREATE INDEX IF NOT EXISTS licenses_version_idx ON licenses(version);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- Indexes for verification_tokens
CREATE INDEX IF NOT EXISTS verification_tokens_user_id_idx ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS verification_tokens_type_idx ON verification_tokens(type);
CREATE INDEX IF NOT EXISTS verification_tokens_expires_at_idx ON verification_tokens(expires_at);

-- Indexes for stripe_webhook_events
CREATE INDEX IF NOT EXISTS stripe_webhook_events_stripe_event_id_idx ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_processed_idx ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_created_at_idx ON stripe_webhook_events(created_at DESC);

-- Indexes for log_events
CREATE INDEX IF NOT EXISTS log_events_entity_type_idx ON log_events(entity_type);
CREATE INDEX IF NOT EXISTS log_events_created_at_idx ON log_events(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "User follows are publicly viewable"
  ON user_follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can manage own follows"
  ON user_follows FOR ALL
  USING (auth.uid() = follower_id);

-- RLS Policies for user_tags
CREATE POLICY "User tags are publicly viewable"
  ON user_tags FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can manage own tags"
  ON user_tags FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_reviews
CREATE POLICY "User reviews are publicly viewable"
  ON user_reviews FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can create reviews for others"
  ON user_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews"
  ON user_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete own reviews"
  ON user_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for activity_feed
CREATE POLICY "Activity feed is publicly viewable"
  ON activity_feed FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can manage activity feed"
  ON activity_feed FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for licenses
CREATE POLICY "Licenses are publicly viewable"
  ON licenses FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Service role can manage licenses"
  ON licenses FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for verification_tokens
CREATE POLICY "Users can view own verification tokens"
  ON verification_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verification tokens"
  ON verification_tokens FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for stripe_webhook_events
CREATE POLICY "Service role can manage webhook events"
  ON stripe_webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for log_events
CREATE POLICY "Service role can manage log events"
  ON log_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_user_follows
  BEFORE UPDATE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_user_tags
  BEFORE UPDATE ON user_tags
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_user_reviews
  BEFORE UPDATE ON user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_notifications
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_activity_feed
  BEFORE UPDATE ON activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_licenses
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_sessions
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_verification_tokens
  BEFORE UPDATE ON verification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_stripe_webhook_events
  BEFORE UPDATE ON stripe_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_log_events
  BEFORE UPDATE ON log_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
