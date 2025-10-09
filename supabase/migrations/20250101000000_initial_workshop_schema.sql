-- ============================================================================
-- Workshop Platform - Fully Normalized Schema Migration
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE project_status AS ENUM ('draft', 'active', 'archived', 'published');
CREATE TYPE asset_status AS ENUM ('draft', 'active', 'archived', 'published');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'revoked');
CREATE TYPE address_type AS ENUM ('shipping', 'billing', 'both');
CREATE TYPE license_type AS ENUM ('free', 'attribution', 'commercial', 'exclusive');
CREATE TYPE reference_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE notification_type AS ENUM (
  'asset_reference_request',
  'asset_reference_approved',
  'asset_reference_rejected',
  'collaborator_invite',
  'collaborator_joined',
  'project_published',
  'order_received',
  'payout_completed',
  'payout_failed'
);
CREATE TYPE permission_type AS ENUM ('read', 'write', 'delete', 'admin', 'manage_collaborators', 'manage_pricing');

-- ============================================================================
-- USERS TABLES
-- ============================================================================

CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_vp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  address_type address_type NOT NULL DEFAULT 'shipping',
  is_primary BOOLEAN DEFAULT FALSE,
  full_name TEXT NOT NULL CHECK (length(full_name) >= 1 AND length(full_name) <= 200),
  company_name TEXT CHECK (length(company_name) <= 200),
  address_line1 TEXT NOT NULL CHECK (length(address_line1) >= 1 AND length(address_line1) <= 255),
  address_line2 TEXT CHECK (length(address_line2) <= 255),
  city TEXT NOT NULL CHECK (length(city) >= 1 AND length(city) <= 100),
  state_province TEXT CHECK (length(state_province) <= 100),
  postal_code TEXT NOT NULL CHECK (length(postal_code) >= 1 AND length(postal_code) <= 20),
  country_code TEXT NOT NULL CHECK (length(country_code) = 2),
  phone TEXT CHECK (length(phone) <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_primary_address_per_user UNIQUE NULLS NOT DISTINCT (user_id, is_primary, address_type)
);

CREATE TABLE users_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS TABLES
-- ============================================================================

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 1000),
  slug TEXT UNIQUE NOT NULL,
  status project_status DEFAULT 'draft',
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE,
  allow_forks BOOLEAN DEFAULT FALSE,
  allow_downloads BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  license_type license_type NOT NULL,
  license_terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL CHECK (length(tag) >= 1 AND length(tag) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, tag)
);

CREATE TABLE project_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  collaborator_count INTEGER DEFAULT 0,
  asset_count INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  invitation_status invitation_status DEFAULT 'pending',
  contribution_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE project_collaborator_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id UUID REFERENCES project_collaborators(id) ON DELETE CASCADE NOT NULL,
  permission permission_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collaborator_id, permission)
);

CREATE TABLE project_collaborator_revenue_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  collaborator_id UUID REFERENCES project_collaborators(id) ON DELETE CASCADE NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSETS TABLES
-- ============================================================================

CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 500),
  thumbnail_url TEXT,
  preview_url TEXT,
  status asset_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  seeking_collaborators BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE,
  allow_downloads BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_royalties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 50),
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  license_type license_type NOT NULL,
  license_terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL CHECK (length(tag) >= 1 AND length(tag) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, tag)
);

CREATE TABLE asset_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  reference_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT,
  file_name TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LICENSING TABLES
-- ============================================================================

CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  agreement TEXT NOT NULL,
  is_platform_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_license_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  licensor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  licensee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, licensee_id, license_id)
);

-- ============================================================================
-- RELATIONSHIP TABLES
-- ============================================================================

CREATE TABLE project_asset_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_royalty_id UUID REFERENCES asset_royalties(id) ON DELETE SET NULL,
  status reference_status DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, asset_id)
);

-- ============================================================================
-- MARKETPLACE TABLES
-- ============================================================================

CREATE TABLE asset_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id) NOT NULL,
  currency_code TEXT NOT NULL CHECK (length(currency_code) = 3),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  status order_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  billing_address_id UUID REFERENCES users_addresses(id),
  shipping_address_id UUID REFERENCES users_addresses(id),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, key)
);

CREATE TABLE order_revenue_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('platform_fee', 'asset_royalty', 'collaborator_share', 'project_creator')),
  resource_id UUID,
  resource_type TEXT CHECK (resource_type IN ('asset', 'project', 'platform')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  status payout_status DEFAULT 'pending',
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCT LISTING SYSTEM
-- ============================================================================

CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL CHECK (length(handle) >= 1 AND length(handle) <= 100),
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT CHECK (length(description) <= 5000),
  status product_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, project_id)
);

CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  handle TEXT UNIQUE NOT NULL CHECK (length(handle) >= 1 AND length(handle) <= 100),
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES product_collections(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, collection_id)
);

CREATE TABLE product_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL CHECK (length(tag) >= 1 AND length(tag) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, tag)
);

CREATE TABLE product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE CHECK (length(sku) <= 100),
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
  is_available BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variant_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  currency_code TEXT NOT NULL CHECK (length(currency_code) = 3),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  compare_at_amount_cents INTEGER CHECK (compare_at_amount_cents >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, currency_code)
);

CREATE TABLE product_variant_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  option_name TEXT NOT NULL CHECK (length(option_name) >= 1 AND length(option_name) <= 100),
  option_value TEXT NOT NULL CHECK (length(option_value) >= 1 AND length(option_value) <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, option_name)
);

CREATE TABLE product_digital_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_print_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  printer_integration_id TEXT NOT NULL,
  print_template_id TEXT,
  paper_type TEXT,
  finish_type TEXT,
  dimensions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  meta_title TEXT CHECK (length(meta_title) <= 200),
  meta_description TEXT CHECK (length(meta_description) <= 500),
  meta_keywords TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS & COMMUNICATION
-- ============================================================================

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  resource_type TEXT CHECK (resource_type IN ('project', 'asset', 'order', 'payout', 'collaborator')),
  resource_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_review (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

CREATE TABLE project_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STRIPE CONNECT TABLES
-- ============================================================================

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

CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status payout_status DEFAULT 'pending',
  stripe_transfer_id TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

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

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Projects indexes
CREATE INDEX idx_projects_creator_id ON projects(creator_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Project settings indexes
CREATE INDEX idx_project_settings_project_id ON project_settings(project_id);
CREATE INDEX idx_project_settings_is_public ON project_settings(is_public);

-- Project licenses indexes
CREATE INDEX idx_project_licenses_project_id ON project_licenses(project_id);
CREATE INDEX idx_project_licenses_is_active ON project_licenses(is_active);

-- Project tags indexes
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag);

-- Project stats indexes
CREATE INDEX idx_project_stats_project_id ON project_stats(project_id);

-- Collaborators indexes
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_status ON project_collaborators(invitation_status);

-- Collaborator permissions indexes
CREATE INDEX idx_collaborator_permissions_collaborator_id ON project_collaborator_permissions(collaborator_id);

-- Collaborator revenue splits indexes
CREATE INDEX idx_collaborator_revenue_splits_collaborator_id ON project_collaborator_revenue_splits(collaborator_id);
CREATE INDEX idx_collaborator_revenue_splits_is_active ON project_collaborator_revenue_splits(is_active);

-- Assets indexes
CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_status ON assets(status);

-- Asset settings indexes
CREATE INDEX idx_asset_settings_asset_id ON asset_settings(asset_id);
CREATE INDEX idx_asset_settings_is_public ON asset_settings(is_public);
CREATE INDEX idx_asset_settings_is_featured ON asset_settings(is_featured);
CREATE INDEX idx_asset_settings_seeking_collaborators ON asset_settings(seeking_collaborators);

-- Asset royalties indexes
CREATE INDEX idx_asset_royalties_asset_id ON asset_royalties(asset_id);
CREATE INDEX idx_asset_royalties_is_active ON asset_royalties(is_active);

-- Asset licenses indexes
CREATE INDEX idx_asset_licenses_asset_id ON asset_licenses(asset_id);
CREATE INDEX idx_asset_licenses_is_active ON asset_licenses(is_active);

-- Asset tags indexes
CREATE INDEX idx_asset_tags_asset_id ON asset_tags(asset_id);
CREATE INDEX idx_asset_tags_tag ON asset_tags(tag);

-- Asset stats indexes
CREATE INDEX idx_asset_stats_asset_id ON asset_stats(asset_id);

-- Asset files indexes
CREATE INDEX idx_asset_images_asset_id ON asset_images(asset_id);
CREATE INDEX idx_asset_files_asset_id ON asset_files(asset_id);

-- License grants indexes
CREATE INDEX idx_asset_license_grants_licensor_id ON asset_license_grants(licensor_id);
CREATE INDEX idx_asset_license_grants_licensee_id ON asset_license_grants(licensee_id);
CREATE INDEX idx_asset_license_grants_asset_id ON asset_license_grants(asset_id);
CREATE INDEX idx_asset_license_grants_is_active ON asset_license_grants(is_active);

-- References indexes
CREATE INDEX idx_project_asset_refs_project_id ON project_asset_references(project_id);
CREATE INDEX idx_project_asset_refs_asset_id ON project_asset_references(asset_id);
CREATE INDEX idx_project_asset_refs_requested_by ON project_asset_references(requested_by);
CREATE INDEX idx_project_asset_refs_status ON project_asset_references(status);

-- Pricing indexes
CREATE INDEX idx_asset_pricing_asset_id ON asset_pricing(asset_id);
CREATE INDEX idx_asset_pricing_is_active ON asset_pricing(is_active);
CREATE INDEX idx_project_pricing_project_id ON project_pricing(project_id);
CREATE INDEX idx_project_pricing_is_active ON project_pricing(is_active);

-- Orders indexes
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_variant_id ON orders(variant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_currency_code ON orders(currency_code);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order metadata indexes
CREATE INDEX idx_order_metadata_order_id ON order_metadata(order_id);

-- Revenue splits indexes
CREATE INDEX idx_revenue_splits_order_id ON order_revenue_splits(order_id);
CREATE INDEX idx_revenue_splits_recipient_id ON order_revenue_splits(recipient_id);
CREATE INDEX idx_revenue_splits_status ON order_revenue_splits(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Comments indexes
CREATE INDEX idx_asset_comments_asset_id ON asset_comments(asset_id);
CREATE INDEX idx_asset_comments_author_id ON asset_comments(author_id);
CREATE INDEX idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX idx_project_comments_author_id ON project_comments(author_id);

-- Chat indexes
CREATE INDEX idx_project_chat_project_id ON project_chat(project_id);
CREATE INDEX idx_project_chat_created_at ON project_chat(project_id, created_at DESC);

-- Stripe indexes
CREATE INDEX idx_stripe_accounts_user_id ON stripe_connected_accounts(user_id);
CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_schedules_user_id ON payout_schedules(user_id);

-- Webhook indexes
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);

-- Product indexes
CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_published_at ON products(published_at DESC);

-- Product projects indexes
CREATE INDEX idx_product_projects_product_id ON product_projects(product_id);
CREATE INDEX idx_product_projects_project_id ON product_projects(project_id);

-- Product images indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(product_id, is_primary);

-- Product collections indexes
CREATE INDEX idx_product_collections_handle ON product_collections(handle);
CREATE INDEX idx_product_collections_is_visible ON product_collections(is_visible);

-- Product collection items indexes
CREATE INDEX idx_product_collection_items_product_id ON product_collection_items(product_id);
CREATE INDEX idx_product_collection_items_collection_id ON product_collection_items(collection_id);

-- Product tags indexes
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag);

-- Product variants indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_is_available ON product_variants(is_available);

-- Product variant prices indexes
CREATE INDEX idx_product_variant_prices_variant_id ON product_variant_prices(variant_id);
CREATE INDEX idx_product_variant_prices_currency_code ON product_variant_prices(currency_code);
CREATE INDEX idx_product_variant_prices_is_active ON product_variant_prices(is_active);

-- Product variant options indexes
CREATE INDEX idx_product_variant_options_variant_id ON product_variant_options(variant_id);

-- Product digital files indexes
CREATE INDEX idx_product_digital_files_variant_id ON product_digital_files(variant_id);

-- Product print options indexes
CREATE INDEX idx_product_print_options_variant_id ON product_print_options(variant_id);

-- Product SEO indexes
CREATE INDEX idx_product_seo_product_id ON product_seo(product_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_addresses_updated_at BEFORE UPDATE ON users_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_links_updated_at BEFORE UPDATE ON users_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON project_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_licenses_updated_at BEFORE UPDATE ON project_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_stats_updated_at BEFORE UPDATE ON project_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_collaborators_updated_at BEFORE UPDATE ON project_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborator_revenue_splits_updated_at BEFORE UPDATE ON project_collaborator_revenue_splits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_settings_updated_at BEFORE UPDATE ON asset_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_royalties_updated_at BEFORE UPDATE ON asset_royalties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_licenses_updated_at BEFORE UPDATE ON asset_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_stats_updated_at BEFORE UPDATE ON asset_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_images_updated_at BEFORE UPDATE ON asset_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_files_updated_at BEFORE UPDATE ON asset_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_license_grants_updated_at BEFORE UPDATE ON asset_license_grants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_asset_refs_updated_at BEFORE UPDATE ON project_asset_references
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_pricing_updated_at BEFORE UPDATE ON asset_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_pricing_updated_at BEFORE UPDATE ON project_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_comments_updated_at BEFORE UPDATE ON asset_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_comments_updated_at BEFORE UPDATE ON project_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_revenue_splits_updated_at BEFORE UPDATE ON order_revenue_splits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_accounts_updated_at BEFORE UPDATE ON stripe_connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_schedules_updated_at BEFORE UPDATE ON payout_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_collections_updated_at BEFORE UPDATE ON product_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variant_prices_updated_at BEFORE UPDATE ON product_variant_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_digital_files_updated_at BEFORE UPDATE ON product_digital_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_print_options_updated_at BEFORE UPDATE ON product_print_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_seo_updated_at BEFORE UPDATE ON product_seo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create user profile when auth.users record is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to create default settings when asset is created
CREATE OR REPLACE FUNCTION handle_new_asset()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO asset_settings (asset_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  INSERT INTO asset_stats (asset_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_asset_created
  AFTER INSERT ON assets
  FOR EACH ROW EXECUTE FUNCTION handle_new_asset();

-- Trigger to create default settings when project is created
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_settings (project_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  INSERT INTO project_stats (project_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_new_project();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborator_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborator_revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_license_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_asset_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_digital_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_print_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_schedules ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Products policies (public read for active products)
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Project creators can manage products" ON products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM product_projects pp
    JOIN projects p ON p.id = pp.project_id
    WHERE pp.product_id = products.id AND p.creator_id = auth.uid()
  )
);

-- Product variants policies
CREATE POLICY "Anyone can view variants of active products" ON product_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_variants.product_id AND status = 'active')
);

-- Product variant prices policies  
CREATE POLICY "Anyone can view active variant prices" ON product_variant_prices FOR SELECT USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = product_variant_prices.variant_id AND p.status = 'active'
  )
);

-- Product images policies
CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_images.product_id AND status = 'active')
);

-- Product collections policies
CREATE POLICY "Anyone can view visible collections" ON product_collections FOR SELECT USING (is_visible = true);
CREATE POLICY "Anyone can view collection items" ON product_collection_items FOR SELECT USING (true);

-- Product tags, options, SEO (public read)
CREATE POLICY "Anyone can view product tags" ON product_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view variant options" ON product_variant_options FOR SELECT USING (true);
CREATE POLICY "Anyone can view product SEO" ON product_seo FOR SELECT USING (true);

-- Digital files - only after purchase
CREATE POLICY "Buyers can view digital files after purchase" ON product_digital_files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.variant_id = product_digital_files.variant_id
    AND o.buyer_id = auth.uid()
    AND o.status = 'completed'
  )
);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
