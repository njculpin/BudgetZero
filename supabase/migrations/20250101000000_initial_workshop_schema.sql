-- ============================================================================
-- Workshop Platform - Consolidated Schema Migration
-- ============================================================================
-- This is the complete schema for the Workshop collaborative tabletop game
-- publishing platform. It consolidates all previous migrations into a single
-- clean schema for initial deployment.
--
-- Core Features:
-- - User profiles with creator roles
-- - Unified projects system (games, models, illustrations, documents)
-- - Asset library with royalty tracking
-- - Collaboration and revenue sharing
-- - Marketplace with orders and payments
-- - Stripe Connect for creator payouts
-- - Notifications and activity tracking
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE creator_role AS ENUM ('designer', 'illustrator', 'modeler', 'editor', 'photographer');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'archived', 'published');
CREATE TYPE collaboration_permission AS ENUM ('read', 'comment', 'edit', 'admin');
CREATE TYPE license_type AS ENUM ('free', 'attribution', 'commercial', 'exclusive');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- User Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  creator_roles creator_role[] DEFAULT '{}',
  location TEXT,
  website TEXT,
  portfolio_url TEXT,
  social_links JSONB DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),

  -- Privacy settings
  is_profile_public BOOLEAN DEFAULT true,
  show_email_public BOOLEAN DEFAULT false,
  allow_collaboration_requests BOOLEAN DEFAULT true,

  -- Notification preferences
  notification_preferences JSONB DEFAULT '{
    "email_enabled": true,
    "in_app_enabled": true,
    "collaboration_requests": true,
    "project_updates": true,
    "marketplace_sales": true,
    "playtest_reviews": true,
    "comments": true,
    "marketing": false,
    "frequency": "instant"
  }'::jsonb,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Victory Points System
  total_vp INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Projects Table (games, models, illustrations)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 1000),
  slug TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Project type discriminator
  project_type TEXT NOT NULL CHECK (project_type IN ('game', 'model', 'illustration')),

  -- Status and visibility
  status project_status DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Licensing
  license_type license_type DEFAULT 'free',
  license_terms TEXT,

  -- Pricing (moved to pricing_tiers table)

  -- Game-specific fields (nullable for non-game projects)
  genre TEXT,
  player_count_min INTEGER CHECK (player_count_min > 0),
  player_count_max INTEGER CHECK (player_count_max >= player_count_min),
  play_time_minutes INTEGER CHECK (play_time_minutes > 0),
  complexity_rating INTEGER CHECK (complexity_rating >= 1 AND complexity_rating <= 5),

  -- Collaboration
  seeking_collaborators BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Collaborators
CREATE TABLE project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  collaborator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role creator_role NOT NULL,
  permissions collaboration_permission[] DEFAULT '{"read"}',
  invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'revoked')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  revenue_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (revenue_percentage >= 0 AND revenue_percentage <= 100),
  contribution_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, collaborator_id)
);

-- Assets (3D models, illustrations, photos, textures, audio)
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 500),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('model', 'illustration', 'photo', 'texture', 'audio')),

  -- File information
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  dimensions JSONB,

  -- Metadata
  tags TEXT[] DEFAULT '{}',

  -- Licensing and pricing
  license_type license_type DEFAULT 'attribution',
  license_terms TEXT,
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  royalty_percentage INTEGER DEFAULT 0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),

  -- Publishing
  is_public BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  seeking_collaborators BOOLEAN DEFAULT false,

  -- Stats
  download_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (rulebooks, guides, expansions)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT DEFAULT 'rulebook' CHECK (document_type IN ('rulebook', 'expansion', 'quick_start', 'reference', 'other')),

  -- Content (TipTap JSON)
  content JSONB DEFAULT '{"type":"doc","content":[]}'::jsonb,
  version INTEGER DEFAULT 1,

  -- Licensing
  royalty_percentage INTEGER DEFAULT 0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
  license_type TEXT DEFAULT 'free' CHECK (license_type IN ('free', 'attribution', 'commercial', 'exclusive')),
  license_terms TEXT,

  -- Publishing
  is_public BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seeking_collaborators BOOLEAN DEFAULT false,

  -- Stats
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,

  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RELATIONSHIP TABLES
-- ============================================================================

-- Project Asset References (for attribution and royalty tracking)
CREATE TABLE project_asset_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  royalty_percentage INTEGER NOT NULL CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, asset_id)
);

-- Project Document References
CREATE TABLE project_document_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  royalty_percentage INTEGER NOT NULL CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, document_id)
);

-- ============================================================================
-- MARKETPLACE TABLES
-- ============================================================================

-- Pricing Tiers
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  pricing_tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE RESTRICT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  project_title TEXT NOT NULL,
  pricing_tier_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Revenue Splits
CREATE TABLE revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  payout_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Downloaded Items
CREATE TABLE downloaded_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  download_url TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT must_have_asset_or_document CHECK (
    (asset_id IS NOT NULL AND document_id IS NULL) OR
    (asset_id IS NULL AND document_id IS NOT NULL)
  )
);

-- ============================================================================
-- STRIPE CONNECT TABLES
-- ============================================================================

-- Stripe Connected Accounts
CREATE TABLE stripe_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('express', 'standard')),
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  country TEXT,
  currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payout Requests
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stripe_transfer_id TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Payout Schedules
CREATE TABLE payout_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  minimum_amount DECIMAL(10, 2) NOT NULL DEFAULT 10.00 CHECK (minimum_amount >= 10.00),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  last_payout_at TIMESTAMPTZ,
  next_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ENGAGEMENT TABLES
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaboration Request Comments
CREATE TABLE request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('asset', 'document')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playtest Reviews
CREATE TABLE playtest_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  player_count INTEGER,
  play_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Victory Points Transactions
CREATE TABLE vp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Feed
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('project_created', 'project_updated', 'collaborator_added', 'asset_added', 'rulebook_updated', 'comment_added')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'rulebook', 'asset', 'collaboration')),
  resource_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'rulebook', 'asset')),
  resource_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  is_resolved BOOLEAN DEFAULT FALSE,
  position JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Events (for Stripe)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STORAGE BUCKETS (Supabase Storage)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('models', 'models', true),
  ('illustrations', 'illustrations', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for models bucket
CREATE POLICY "Models are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'models');

CREATE POLICY "Authenticated users can upload models" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own models" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'models'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own models" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'models'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for illustrations bucket
CREATE POLICY "Illustrations are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'illustrations');

CREATE POLICY "Authenticated users can upload illustrations" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'illustrations'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own illustrations" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'illustrations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own illustrations" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'illustrations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for avatars bucket
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_creator_roles ON profiles USING GIN(creator_roles);

-- Projects indexes
CREATE INDEX idx_projects_creator_id ON projects(creator_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_type_status ON projects(project_type, status);

-- Collaborators indexes
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_collaborator_id ON project_collaborators(collaborator_id);

-- Assets indexes
CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);

-- Documents indexes
CREATE INDEX idx_documents_creator ON documents(creator_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_public ON documents(is_public);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- Reference indexes
CREATE INDEX idx_project_asset_references_project ON project_asset_references(project_id);
CREATE INDEX idx_project_asset_references_asset ON project_asset_references(asset_id);
CREATE INDEX idx_project_asset_references_status ON project_asset_references(status) WHERE status = 'pending';
CREATE INDEX idx_project_document_refs_project ON project_document_references(project_id);
CREATE INDEX idx_project_document_refs_document ON project_document_references(document_id);
CREATE INDEX idx_project_document_refs_status ON project_document_references(status);

-- Marketplace indexes
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_project_id ON order_items(project_id);
CREATE INDEX idx_revenue_splits_order_item_id ON revenue_splits(order_item_id);
CREATE INDEX idx_revenue_splits_recipient_id ON revenue_splits(recipient_id);
CREATE INDEX idx_revenue_splits_status ON revenue_splits(status);
CREATE INDEX idx_downloaded_items_user_id ON downloaded_items(user_id);
CREATE INDEX idx_downloaded_items_order_item_id ON downloaded_items(order_item_id);

-- Stripe Connect indexes
CREATE INDEX idx_stripe_connected_accounts_user_id ON stripe_connected_accounts(user_id);
CREATE INDEX idx_stripe_connected_accounts_stripe_id ON stripe_connected_accounts(stripe_account_id);
CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_requested_at ON payout_requests(requested_at DESC);
CREATE INDEX idx_payout_schedules_user_id ON payout_schedules(user_id);
CREATE INDEX idx_payout_schedules_next_payout ON payout_schedules(next_payout_at) WHERE enabled = true;

-- Engagement indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_request_comments_request ON request_comments(request_id, request_type);
CREATE INDEX idx_playtest_reviews_project ON playtest_reviews(project_id);
CREATE INDEX idx_vp_transactions_user ON vp_transactions(user_id);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_number := 'WS-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists_check;
    IF NOT exists_check THEN EXIT; END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Calculate revenue splits
CREATE OR REPLACE FUNCTION calculate_revenue_splits(
  p_order_item_id UUID,
  p_project_id UUID,
  p_price DECIMAL
)
RETURNS void AS $$
DECLARE
  v_creator_id UUID;
  v_total_royalty_percentage DECIMAL := 0;
  v_creator_percentage DECIMAL;
  v_platform_fee_percentage DECIMAL := 10;
  v_platform_amount DECIMAL;
  v_creator_amount DECIMAL;
  v_collaborator_amount DECIMAL;
  v_collaborator RECORD;
  v_platform_account_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  SELECT creator_id INTO v_creator_id FROM projects WHERE id = p_project_id;

  SELECT COALESCE(SUM(royalty_percentage), 0) INTO v_total_royalty_percentage
  FROM project_asset_references WHERE project_id = p_project_id AND status = 'approved';

  v_platform_amount := p_price * v_platform_fee_percentage / 100;

  IF v_platform_amount > 0 THEN
    INSERT INTO revenue_splits (order_item_id, recipient_id, amount, percentage, status)
    VALUES (p_order_item_id, v_platform_account_id, v_platform_amount, v_platform_fee_percentage, 'paid');
  END IF;

  v_creator_percentage := 100 - v_platform_fee_percentage - v_total_royalty_percentage;
  v_creator_amount := p_price * v_creator_percentage / 100;

  IF v_creator_amount > 0 THEN
    INSERT INTO revenue_splits (order_item_id, recipient_id, amount, percentage)
    VALUES (p_order_item_id, v_creator_id, v_creator_amount, v_creator_percentage);
  END IF;

  FOR v_collaborator IN
    SELECT DISTINCT a.creator_id, par.royalty_percentage
    FROM project_asset_references par
    JOIN assets a ON a.id = par.asset_id
    WHERE par.project_id = p_project_id AND par.status = 'approved' AND a.creator_id != v_creator_id
  LOOP
    v_collaborator_amount := p_price * v_collaborator.royalty_percentage / 100;
    IF v_collaborator_amount > 0 THEN
      INSERT INTO revenue_splits (order_item_id, recipient_id, amount, percentage)
      VALUES (p_order_item_id, v_collaborator.creator_id, v_collaborator_amount, v_collaborator.royalty_percentage);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Earnings calculation functions
CREATE OR REPLACE FUNCTION get_available_balance(p_user_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(amount) FROM revenue_splits
    WHERE recipient_id = p_user_id AND status = 'processing'
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_pending_earnings(p_user_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(amount) FROM revenue_splits
    WHERE recipient_id = p_user_id AND status = 'pending'
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_lifetime_earnings(p_user_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(amount) FROM revenue_splits WHERE recipient_id = p_user_id
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate next payout date
CREATE OR REPLACE FUNCTION calculate_next_payout_date(
  p_frequency TEXT,
  p_day_of_month INTEGER DEFAULT 1
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_date TIMESTAMPTZ;
  v_current_date TIMESTAMPTZ := now();
BEGIN
  CASE p_frequency
    WHEN 'weekly' THEN
      v_next_date := date_trunc('week', v_current_date) + interval '7 days';
    WHEN 'biweekly' THEN
      v_next_date := date_trunc('week', v_current_date) + interval '14 days';
    WHEN 'monthly' THEN
      IF EXTRACT(DAY FROM v_current_date) >= p_day_of_month THEN
        v_next_date := date_trunc('month', v_current_date) + interval '1 month';
      ELSE
        v_next_date := date_trunc('month', v_current_date);
      END IF;
      v_next_date := v_next_date + (p_day_of_month - 1) * interval '1 day';
    ELSE
      v_next_date := v_current_date + interval '1 month';
  END CASE;
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- Victory Points functions
CREATE OR REPLACE FUNCTION award_vp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO vp_transactions (user_id, amount, reason, description, reference_type, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_description, p_reference_type, p_reference_id);

  UPDATE profiles SET total_vp = total_vp + p_amount WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_collaborators_updated_at BEFORE UPDATE ON project_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number trigger
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Payout schedule trigger
CREATE OR REPLACE FUNCTION update_next_payout_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enabled THEN
    NEW.next_payout_at := calculate_next_payout_date(NEW.frequency, NEW.day_of_month);
  ELSE
    NEW.next_payout_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_payout_date
  BEFORE INSERT OR UPDATE ON payout_schedules
  FOR EACH ROW EXECUTE FUNCTION update_next_payout_date();

-- Profile creation trigger
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_asset_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_document_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloaded_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE playtest_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles viewable by everyone" ON profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Public projects viewable by everyone" ON projects FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "Collaborators can view projects" ON projects FOR SELECT USING (
  auth.uid() IN (
    SELECT collaborator_id FROM project_collaborators
    WHERE project_id = projects.id AND invitation_status = 'accepted' AND is_active = true
  )
);
CREATE POLICY "Project creators can manage projects" ON projects FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Anyone can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Assets policies
CREATE POLICY "Public assets viewable" ON assets FOR SELECT USING (is_public = true);
CREATE POLICY "Asset creators can manage assets" ON assets FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Anyone can create assets" ON assets FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Documents policies
CREATE POLICY "Public documents viewable" ON documents FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create documents" ON documents FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = creator_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = buyer_id);

-- Revenue splits policies
CREATE POLICY "Users can view own revenue" ON revenue_splits FOR SELECT USING (auth.uid() = recipient_id);

-- Stripe Connect policies
CREATE POLICY "Users can view own stripe account" ON stripe_connected_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own stripe account" ON stripe_connected_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own payout requests" ON payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payout requests" ON payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payout schedule" ON payout_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payout schedule" ON payout_schedules FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- VP Transactions policies
CREATE POLICY "Users can view own vp transactions" ON vp_transactions FOR SELECT USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on accessible resources" ON comments FOR SELECT USING (
  CASE
    WHEN resource_type = 'project' THEN
      resource_id::uuid IN (SELECT id FROM projects WHERE creator_id = auth.uid() OR is_public = true)
    WHEN resource_type = 'asset' THEN
      resource_id::uuid IN (SELECT id FROM assets WHERE creator_id = auth.uid() OR is_public = true)
    ELSE false
  END
);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);

-- ============================================================================
-- COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Workshop Platform - Consolidated Schema v1.0';
