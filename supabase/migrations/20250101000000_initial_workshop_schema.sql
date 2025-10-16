-- ============================================================================
-- BudgetZero Platform - Initial Schema Migration
-- Description: Complete database schema for asset marketplace with teams,
--              products, sales tracking, and royalty distribution
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE fee_type AS ENUM ('percentage', 'fixed');
CREATE TYPE royalty_type AS ENUM ('fixed', 'percentage');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE royalty_transaction_status AS ENUM ('pending', 'ready_to_pay', 'paid', 'failed', 'refunded');
CREATE TYPE entity_type AS ENUM ('user', 'asset', 'product', 'sale', 'sale_item', 'team', 'license');

-- ============================================================================
-- USERS TABLES
-- ============================================================================

CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  username TEXT UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN users.verified IS 'Whether user email/identity has been verified';
COMMENT ON COLUMN users.is_deleted IS 'Soft delete flag - user account deactivated';

CREATE TABLE user_addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  address_type TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE NOT NULL,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT NOT NULL,
  country_code TEXT NOT NULL CHECK (length(country_code) = 2),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE user_addresses IS 'User shipping and billing addresses';
COMMENT ON COLUMN user_addresses.address_type IS 'Type of address: shipping, billing, both';

CREATE TABLE user_stripe_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE user_stripe_accounts IS 'Stripe integration for payments and payouts';
COMMENT ON COLUMN user_stripe_accounts.stripe_customer_id IS 'Stripe customer ID for buyers (checkout, saved cards)';
COMMENT ON COLUMN user_stripe_accounts.stripe_account_id IS 'Stripe Connected Account ID for creators (payouts)';

CREATE TABLE user_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_transfer_id TEXT,
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  status payout_status DEFAULT 'pending' NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ
);

COMMENT ON TABLE user_payouts IS 'Monthly payout aggregations for creators (minimum $10 threshold)';
COMMENT ON COLUMN user_payouts.period_start IS 'Start of payout period (typically monthly)';
COMMENT ON COLUMN user_payouts.period_end IS 'End of payout period';

CREATE TABLE user_stripe_invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_invoice_id TEXT NOT NULL,
  invoice_url TEXT,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents INTEGER DEFAULT 0 NOT NULL CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  status invoice_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE user_stripe_invoices IS 'Stripe invoices for platform subscriptions or fees';

-- ============================================================================
-- TEAMS TABLES
-- ============================================================================

CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE teams IS 'Teams for collaborative work on products';

CREATE TABLE team_users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  credits TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, team_id)
);

COMMENT ON TABLE team_users IS 'Team membership with contribution credits';
COMMENT ON COLUMN team_users.credits IS 'Simple string describing what the user worked on';

CREATE TABLE team_channels (
  id BIGSERIAL PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE team_channels IS 'Chat channels within teams';

CREATE TABLE team_chat_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_id BIGINT REFERENCES team_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL CHECK (length(message) >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE team_chat_messages IS 'Messages within team channels';

CREATE TABLE team_chat_message_attachments (
  id BIGSERIAL PRIMARY KEY,
  chat_message_id BIGINT REFERENCES team_chat_messages(id) ON DELETE CASCADE NOT NULL,
  attachment_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE team_chat_message_attachments IS 'File attachments for chat messages';

CREATE TABLE team_chat_message_reactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  chat_message_id BIGINT REFERENCES team_chat_messages(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (length(reaction) <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, chat_message_id, reaction)
);

COMMENT ON TABLE team_chat_message_reactions IS 'Emoji reactions to chat messages';
COMMENT ON COLUMN team_chat_message_reactions.reaction IS 'Emoji character or shortcode';

-- ============================================================================
-- ASSETS TABLES
-- ============================================================================

CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE assets IS 'Uploadable assets (ZIP files containing PDFs, STLs, PNGs, etc.)';
COMMENT ON COLUMN assets.title IS 'Asset name displayed to users';
COMMENT ON COLUMN assets.description IS 'Detailed description of asset contents';

CREATE TABLE asset_tags (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  namespace TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(asset_id, namespace, value)
);

COMMENT ON TABLE asset_tags IS 'Namespaced tags for asset categorization and search';
COMMENT ON COLUMN asset_tags.namespace IS 'Tag category (e.g., "category", "style", "game-system")';
COMMENT ON COLUMN asset_tags.value IS 'Tag value within namespace';

CREATE TABLE asset_images (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE asset_images IS 'Preview images for assets (up to 6 images)';
COMMENT ON COLUMN asset_images.position IS 'Display order for image gallery';

CREATE TABLE asset_files (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE asset_files IS 'Downloadable files within asset (ZIP archives, individual files)';

CREATE TABLE asset_royalties (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  royalty_type royalty_type NOT NULL,
  royalty_value NUMERIC(10, 2) NOT NULL CHECK (royalty_value >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE asset_royalties IS 'Royalty terms for asset creators/contributors';
COMMENT ON COLUMN asset_royalties.royalty_type IS 'Fixed amount (cents) or percentage of sale';
COMMENT ON COLUMN asset_royalties.royalty_value IS 'Amount in cents (fixed) or percentage 0-100 (percentage)';

-- ============================================================================
-- LICENSES TABLES
-- ============================================================================

CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  agreement TEXT NOT NULL,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE licenses IS 'License templates (platform default and future custom licenses)';
COMMENT ON COLUMN licenses.version IS 'License version for tracking agreement changes';
COMMENT ON COLUMN licenses.agreement IS 'Full legal text of license agreement';

CREATE TABLE asset_licenses (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE asset_licenses IS 'Active licenses bound to assets';
COMMENT ON COLUMN asset_licenses.is_active IS 'Whether this license is currently active';
COMMENT ON COLUMN asset_licenses.expires_at IS 'Optional expiration date for time-limited licenses';

CREATE TABLE asset_license_acceptances (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  asset_license_id BIGINT REFERENCES asset_licenses(id) ON DELETE CASCADE NOT NULL,
  asset_license_title TEXT NOT NULL,
  asset_license_version TEXT NOT NULL,
  asset_license_agreement TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE asset_license_acceptances IS 'User acceptance record of asset licenses';
COMMENT ON COLUMN asset_license_acceptances.asset_license_title IS 'Snapshot of license title at acceptance time';
COMMENT ON COLUMN asset_license_acceptances.asset_license_version IS 'Snapshot of license version at acceptance time';
COMMENT ON COLUMN asset_license_acceptances.asset_license_agreement IS 'Snapshot of full agreement text at acceptance time';

-- ============================================================================
-- PRODUCTS TABLES
-- ============================================================================

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL CHECK (length(handle) >= 1 AND length(handle) <= 100),
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE products IS 'Products (collections of assets) for sale on marketplace';
COMMENT ON COLUMN products.handle IS 'URL-friendly slug for product pages';

CREATE TABLE product_categories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_categories IS 'Product categorization for marketplace browsing';

CREATE TABLE product_to_product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  category_id BIGINT REFERENCES product_categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, category_id)
);

COMMENT ON TABLE product_to_product_categories IS 'Many-to-many relationship between products and categories';

CREATE TABLE product_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(product_id, team_id)
);

COMMENT ON TABLE product_teams IS 'Teams associated with product creation';

CREATE TABLE product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_variants IS 'Product variations (e.g., different asset bundles, print options)';
COMMENT ON COLUMN product_variants.sku IS 'Stock keeping unit for inventory tracking';

CREATE TABLE product_variant_assets (
  id BIGSERIAL PRIMARY KEY,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(variant_id, asset_id)
);

COMMENT ON TABLE product_variant_assets IS 'Assets included in each product variant';

CREATE TABLE product_variant_images (
  id BIGSERIAL PRIMARY KEY,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  visible BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_variant_images IS 'Preview images for product variants';

CREATE TABLE product_prices (
  id BIGSERIAL PRIMARY KEY,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_prices IS 'Pricing for product variants';

CREATE TABLE product_ratings (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE(product_id, user_id)
);

COMMENT ON TABLE product_ratings IS 'User ratings and reviews for products';

CREATE TABLE asset_to_products (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(asset_id, product_id)
);

COMMENT ON TABLE asset_to_products IS 'Tracking which assets are used in which products (for royalty calculation)';

-- ============================================================================
-- STRIPE PLATFORM CONFIGURATION
-- ============================================================================

CREATE TABLE stripe_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lookup_name TEXT UNIQUE NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  fee_type fee_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE stripe_prices IS 'Platform fee configuration (e.g., 2% platform fee)';
COMMENT ON COLUMN stripe_prices.lookup_name IS 'Identifier for fee type (e.g., "platform_fee_2_percent")';
COMMENT ON COLUMN stripe_prices.fee_type IS 'Whether fee is percentage of sale or fixed amount';

-- ============================================================================
-- SALES & REVENUE TABLES
-- ============================================================================

CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  stripe_charge_id TEXT,
  status order_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE sales IS 'Customer purchases (orders)';
COMMENT ON COLUMN sales.user_id IS 'Buyer user ID';

CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE sale_items IS 'Individual line items within a sale';
COMMENT ON COLUMN sale_items.snapshot IS 'Complete snapshot of product, variant, assets, and royalty terms at time of sale';

CREATE TABLE sale_item_assets (
  id BIGSERIAL PRIMARY KEY,
  sale_item_id BIGINT REFERENCES sale_items(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE sale_item_assets IS 'Assets included in a sale item (for download access)';

CREATE TABLE sale_royalty_transactions (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  sale_item_id BIGINT REFERENCES sale_items(id) ON DELETE CASCADE NOT NULL,
  sale_item_asset_id BIGINT REFERENCES sale_item_assets(id) ON DELETE CASCADE,
  asset_royalty_id BIGINT REFERENCES asset_royalties(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  royalty_type royalty_type NOT NULL,
  royalty_value NUMERIC(10, 2) NOT NULL CHECK (royalty_value >= 0),
  calculated_cents INTEGER NOT NULL CHECK (calculated_cents >= 0),
  status royalty_transaction_status DEFAULT 'pending' NOT NULL,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ
);

COMMENT ON TABLE sale_royalty_transactions IS 'Individual royalty payment records per sale';
COMMENT ON COLUMN sale_royalty_transactions.calculated_cents IS 'Final amount in cents to pay recipient';
COMMENT ON COLUMN sale_royalty_transactions.status IS 'Payment workflow status (aggregated into monthly payouts)';

CREATE TABLE sale_license_transactions (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  sale_item_id BIGINT REFERENCES sale_items(id) ON DELETE CASCADE NOT NULL,
  sale_item_asset_id BIGINT REFERENCES sale_item_assets(id) ON DELETE CASCADE NOT NULL,
  asset_license_id BIGINT REFERENCES asset_licenses(id) ON DELETE SET NULL,
  asset_license_title TEXT NOT NULL,
  asset_license_version TEXT NOT NULL,
  asset_license_agreement TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE sale_license_transactions IS 'License grants automatically applied upon purchase';
COMMENT ON COLUMN sale_license_transactions.asset_license_title IS 'Snapshot of license title at purchase time';
COMMENT ON COLUMN sale_license_transactions.asset_license_version IS 'Snapshot of license version at purchase time';
COMMENT ON COLUMN sale_license_transactions.asset_license_agreement IS 'Snapshot of agreement text at purchase time';

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

-- ULID generation function for audit logs
CREATE OR REPLACE FUNCTION generate_ulid() RETURNS TEXT AS $$
DECLARE
  timestamp BIGINT;
  random_part TEXT;
BEGIN
  -- Get current timestamp in milliseconds since epoch
  timestamp := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

  -- Generate random component (80 bits = 16 hex characters)
  random_part := encode(gen_random_bytes(10), 'hex');

  -- Combine timestamp and random part (simplified ULID-like format)
  RETURN LPAD(TO_HEX(timestamp), 12, '0') || random_part;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT generate_ulid(),
  request_id UUID,
  entity_type entity_type NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON COLUMN audit_logs.id IS 'ULID identifier for sortable, unique audit entries';
COMMENT ON COLUMN audit_logs.request_id IS 'Request correlation ID for tracing related actions';
COMMENT ON COLUMN audit_logs.snapshot IS 'Complete snapshot of entity and related data at time of action';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE NOT is_deleted;
CREATE INDEX idx_users_username ON users(username) WHERE NOT is_deleted;
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- User addresses indexes
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_user_addresses_is_primary ON user_addresses(user_id, is_primary) WHERE NOT is_deleted;

-- User Stripe accounts indexes
CREATE INDEX idx_user_stripe_accounts_user_id ON user_stripe_accounts(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_user_stripe_accounts_stripe_customer_id ON user_stripe_accounts(stripe_customer_id) WHERE NOT is_deleted;
CREATE INDEX idx_user_stripe_accounts_stripe_account_id ON user_stripe_accounts(stripe_account_id) WHERE NOT is_deleted;

-- User payouts indexes
CREATE INDEX idx_user_payouts_user_id ON user_payouts(user_id);
CREATE INDEX idx_user_payouts_status ON user_payouts(status);
CREATE INDEX idx_user_payouts_period ON user_payouts(period_start, period_end);

-- User invoices indexes
CREATE INDEX idx_user_stripe_invoices_user_id ON user_stripe_invoices(user_id);
CREATE INDEX idx_user_stripe_invoices_status ON user_stripe_invoices(status);

-- Teams indexes
CREATE INDEX idx_teams_name ON teams(name) WHERE NOT is_deleted;
CREATE INDEX idx_teams_is_deleted ON teams(is_deleted);

-- Team users indexes
CREATE INDEX idx_team_users_user_id ON team_users(user_id);
CREATE INDEX idx_team_users_team_id ON team_users(team_id);

-- Team channels indexes
CREATE INDEX idx_team_channels_team_id ON team_channels(team_id) WHERE NOT is_deleted;

-- Team chat messages indexes
CREATE INDEX idx_team_chat_messages_channel_id ON team_chat_messages(channel_id) WHERE NOT is_deleted;
CREATE INDEX idx_team_chat_messages_user_id ON team_chat_messages(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_team_chat_messages_created_at ON team_chat_messages(created_at DESC);

-- Assets indexes
CREATE INDEX idx_assets_user_id ON assets(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_assets_created_at ON assets(created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_assets_is_deleted ON assets(is_deleted);

-- Asset tags indexes
CREATE INDEX idx_asset_tags_asset_id ON asset_tags(asset_id) WHERE NOT is_deleted;
CREATE INDEX idx_asset_tags_namespace_value ON asset_tags(namespace, value) WHERE NOT is_deleted;

-- Asset images indexes
CREATE INDEX idx_asset_images_asset_id ON asset_images(asset_id) WHERE NOT is_deleted;
CREATE INDEX idx_asset_images_position ON asset_images(asset_id, position) WHERE NOT is_deleted;

-- Asset files indexes
CREATE INDEX idx_asset_files_asset_id ON asset_files(asset_id) WHERE NOT is_deleted;

-- Asset royalties indexes
CREATE INDEX idx_asset_royalties_asset_id ON asset_royalties(asset_id) WHERE NOT is_deleted;
CREATE INDEX idx_asset_royalties_user_id ON asset_royalties(user_id) WHERE NOT is_deleted;

-- Licenses indexes
CREATE INDEX idx_licenses_title ON licenses(title) WHERE NOT is_deleted;
CREATE INDEX idx_licenses_is_deleted ON licenses(is_deleted);

-- Asset licenses indexes
CREATE INDEX idx_asset_licenses_asset_id ON asset_licenses(asset_id) WHERE NOT is_deleted;
CREATE INDEX idx_asset_licenses_license_id ON asset_licenses(license_id) WHERE NOT is_deleted;
CREATE INDEX idx_asset_licenses_is_active ON asset_licenses(is_active) WHERE NOT is_deleted;

-- Asset license acceptances indexes
CREATE INDEX idx_asset_license_acceptances_user_id ON asset_license_acceptances(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_asset_license_acceptances_asset_id ON asset_license_acceptances(asset_id) WHERE NOT is_deleted;

-- Products indexes
CREATE INDEX idx_products_handle ON products(handle) WHERE NOT is_deleted;
CREATE INDEX idx_products_created_at ON products(created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_products_is_deleted ON products(is_deleted);

-- Product categories indexes
CREATE INDEX idx_product_categories_title ON product_categories(title) WHERE NOT is_deleted;

-- Product to product categories indexes
CREATE INDEX idx_product_to_categories_product_id ON product_to_product_categories(product_id);
CREATE INDEX idx_product_to_categories_category_id ON product_to_product_categories(category_id);

-- Product teams indexes
CREATE INDEX idx_product_teams_product_id ON product_teams(product_id) WHERE NOT is_deleted;
CREATE INDEX idx_product_teams_team_id ON product_teams(team_id) WHERE NOT is_deleted;

-- Product variants indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id) WHERE NOT is_deleted;
CREATE INDEX idx_product_variants_sku ON product_variants(sku) WHERE NOT is_deleted;

-- Product variant assets indexes
CREATE INDEX idx_product_variant_assets_variant_id ON product_variant_assets(variant_id);
CREATE INDEX idx_product_variant_assets_asset_id ON product_variant_assets(asset_id);

-- Product variant images indexes
CREATE INDEX idx_product_variant_images_variant_id ON product_variant_images(variant_id) WHERE NOT is_deleted;
CREATE INDEX idx_product_variant_images_visible ON product_variant_images(visible) WHERE NOT is_deleted;

-- Product prices indexes
CREATE INDEX idx_product_prices_variant_id ON product_prices(variant_id) WHERE NOT is_deleted;

-- Product ratings indexes
CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id) WHERE NOT is_deleted;
CREATE INDEX idx_product_ratings_user_id ON product_ratings(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_product_ratings_score ON product_ratings(score) WHERE NOT is_deleted;

-- Asset to products indexes
CREATE INDEX idx_asset_to_products_asset_id ON asset_to_products(asset_id);
CREATE INDEX idx_asset_to_products_product_id ON asset_to_products(product_id);

-- Stripe prices indexes
CREATE INDEX idx_stripe_prices_lookup_name ON stripe_prices(lookup_name) WHERE NOT is_deleted;

-- Sales indexes
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_stripe_charge_id ON sales(stripe_charge_id);

-- Sale items indexes
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_sale_items_variant_id ON sale_items(variant_id);

-- Sale item assets indexes
CREATE INDEX idx_sale_item_assets_sale_item_id ON sale_item_assets(sale_item_id);
CREATE INDEX idx_sale_item_assets_asset_id ON sale_item_assets(asset_id);

-- Sale royalty transactions indexes
CREATE INDEX idx_sale_royalty_transactions_sale_id ON sale_royalty_transactions(sale_id);
CREATE INDEX idx_sale_royalty_transactions_recipient_user_id ON sale_royalty_transactions(recipient_user_id);
CREATE INDEX idx_sale_royalty_transactions_status ON sale_royalty_transactions(status);
CREATE INDEX idx_sale_royalty_transactions_paid_at ON sale_royalty_transactions(paid_at);

-- Sale license transactions indexes
CREATE INDEX idx_sale_license_transactions_sale_id ON sale_license_transactions(sale_id);
CREATE INDEX idx_sale_license_transactions_sale_item_id ON sale_license_transactions(sale_item_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

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

CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stripe_accounts_updated_at BEFORE UPDATE ON user_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stripe_invoices_updated_at BEFORE UPDATE ON user_stripe_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_messages_updated_at BEFORE UPDATE ON team_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_message_attachments_updated_at BEFORE UPDATE ON team_chat_message_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_chat_message_reactions_updated_at BEFORE UPDATE ON team_chat_message_reactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_tags_updated_at BEFORE UPDATE ON asset_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_images_updated_at BEFORE UPDATE ON asset_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_files_updated_at BEFORE UPDATE ON asset_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_royalties_updated_at BEFORE UPDATE ON asset_royalties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_licenses_updated_at BEFORE UPDATE ON asset_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_to_product_categories_updated_at BEFORE UPDATE ON product_to_product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variant_images_updated_at BEFORE UPDATE ON product_variant_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON product_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_ratings_updated_at BEFORE UPDATE ON product_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_prices_updated_at BEFORE UPDATE ON stripe_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create user profile when auth.users record is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to cascade soft deletes
CREATE OR REPLACE FUNCTION cascade_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = NOW();

    -- Cascade to related tables based on parent table
    CASE TG_TABLE_NAME
      WHEN 'users' THEN
        UPDATE user_addresses SET is_deleted = TRUE, deleted_at = NOW() WHERE user_id = NEW.id AND NOT is_deleted;
        UPDATE user_stripe_accounts SET is_deleted = TRUE, deleted_at = NOW() WHERE user_id = NEW.id AND NOT is_deleted;

      WHEN 'teams' THEN
        UPDATE team_channels SET is_deleted = TRUE, deleted_at = NOW() WHERE team_id = NEW.id AND NOT is_deleted;
        UPDATE product_teams SET is_deleted = TRUE, deleted_at = NOW() WHERE team_id = NEW.id AND NOT is_deleted;

      WHEN 'team_channels' THEN
        UPDATE team_chat_messages SET is_deleted = TRUE, deleted_at = NOW() WHERE channel_id = NEW.id AND NOT is_deleted;

      WHEN 'team_chat_messages' THEN
        UPDATE team_chat_message_attachments SET is_deleted = TRUE, deleted_at = NOW() WHERE chat_message_id = NEW.id AND NOT is_deleted;
        UPDATE team_chat_message_reactions SET is_deleted = TRUE, deleted_at = NOW() WHERE chat_message_id = NEW.id AND NOT is_deleted;

      WHEN 'assets' THEN
        UPDATE asset_tags SET is_deleted = TRUE, deleted_at = NOW() WHERE asset_id = NEW.id AND NOT is_deleted;
        UPDATE asset_images SET is_deleted = TRUE, deleted_at = NOW() WHERE asset_id = NEW.id AND NOT is_deleted;
        UPDATE asset_files SET is_deleted = TRUE, deleted_at = NOW() WHERE asset_id = NEW.id AND NOT is_deleted;
        UPDATE asset_royalties SET is_deleted = TRUE, deleted_at = NOW() WHERE asset_id = NEW.id AND NOT is_deleted;
        UPDATE asset_licenses SET is_deleted = TRUE, deleted_at = NOW() WHERE asset_id = NEW.id AND NOT is_deleted;

      WHEN 'licenses' THEN
        UPDATE asset_licenses SET is_deleted = TRUE, deleted_at = NOW() WHERE license_id = NEW.id AND NOT is_deleted;

      WHEN 'products' THEN
        UPDATE product_variants SET is_deleted = TRUE, deleted_at = NOW() WHERE product_id = NEW.id AND NOT is_deleted;
        UPDATE product_ratings SET is_deleted = TRUE, deleted_at = NOW() WHERE product_id = NEW.id AND NOT is_deleted;
        UPDATE product_teams SET is_deleted = TRUE, deleted_at = NOW() WHERE product_id = NEW.id AND NOT is_deleted;

      WHEN 'product_variants' THEN
        UPDATE product_variant_images SET is_deleted = TRUE, deleted_at = NOW() WHERE variant_id = NEW.id AND NOT is_deleted;
        UPDATE product_prices SET is_deleted = TRUE, deleted_at = NOW() WHERE variant_id = NEW.id AND NOT is_deleted;

      WHEN 'product_categories' THEN
        -- Product category soft delete doesn't cascade to junction table
        NULL;

      ELSE
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply cascade soft delete trigger to parent tables
CREATE TRIGGER cascade_soft_delete_users BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_teams BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_team_channels BEFORE UPDATE ON team_channels
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_team_chat_messages BEFORE UPDATE ON team_chat_messages
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_assets BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_licenses BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_products BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

CREATE TRIGGER cascade_soft_delete_product_variants BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION cascade_soft_delete();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_license_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_to_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_to_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_item_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_royalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_license_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- User addresses policies
CREATE POLICY "Users can manage their own addresses" ON user_addresses FOR ALL USING (auth.uid() = user_id);

-- User Stripe accounts policies
CREATE POLICY "Users can view their own Stripe accounts" ON user_stripe_accounts FOR SELECT USING (auth.uid() = user_id);

-- User payouts policies
CREATE POLICY "Users can view their own payouts" ON user_payouts FOR SELECT USING (auth.uid() = user_id);

-- User invoices policies
CREATE POLICY "Users can view their own invoices" ON user_stripe_invoices FOR SELECT USING (auth.uid() = user_id);

-- Teams policies
CREATE POLICY "Team members can view their teams" ON teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_users WHERE team_id = teams.id AND user_id = auth.uid())
);

-- Team users policies
CREATE POLICY "Team members can view team membership" ON team_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_users tu WHERE tu.team_id = team_users.team_id AND tu.user_id = auth.uid())
);

-- Team channels policies
CREATE POLICY "Team members can view team channels" ON team_channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_users WHERE team_id = team_channels.team_id AND user_id = auth.uid())
);

-- Team chat messages policies
CREATE POLICY "Team members can view channel messages" ON team_chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_channels tc
    JOIN team_users tu ON tu.team_id = tc.team_id
    WHERE tc.id = team_chat_messages.channel_id AND tu.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create messages" ON team_chat_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_channels tc
    JOIN team_users tu ON tu.team_id = tc.team_id
    WHERE tc.id = team_chat_messages.channel_id AND tu.user_id = auth.uid()
  )
);

-- Assets policies (public read for marketplace)
CREATE POLICY "Anyone can view non-deleted assets" ON assets FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Users can create their own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can soft delete their own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);

-- Asset tags policies
CREATE POLICY "Anyone can view asset tags" ON asset_tags FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Asset owners can manage tags" ON asset_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM assets WHERE id = asset_tags.asset_id AND user_id = auth.uid())
);

-- Asset images policies
CREATE POLICY "Anyone can view asset images" ON asset_images FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Asset owners can manage images" ON asset_images FOR ALL USING (
  EXISTS (SELECT 1 FROM assets WHERE id = asset_images.asset_id AND user_id = auth.uid())
);

-- Asset files policies (downloadable only after purchase or by owner)
CREATE POLICY "Asset owners can view their files" ON asset_files FOR SELECT USING (
  NOT is_deleted AND EXISTS (SELECT 1 FROM assets WHERE id = asset_files.asset_id AND user_id = auth.uid())
);

CREATE POLICY "Buyers can view purchased asset files" ON asset_files FOR SELECT USING (
  NOT is_deleted AND EXISTS (
    SELECT 1 FROM sale_item_assets sia
    JOIN sale_items si ON si.id = sia.sale_item_id
    JOIN sales s ON s.id = si.sale_id
    WHERE sia.asset_id = asset_files.asset_id AND s.user_id = auth.uid() AND s.status = 'paid'
  )
);

CREATE POLICY "Asset owners can manage files" ON asset_files FOR ALL USING (
  EXISTS (SELECT 1 FROM assets WHERE id = asset_files.asset_id AND user_id = auth.uid())
);

-- Asset royalties policies
CREATE POLICY "Asset owners can view royalties" ON asset_royalties FOR SELECT USING (
  NOT is_deleted AND EXISTS (SELECT 1 FROM assets WHERE id = asset_royalties.asset_id AND user_id = auth.uid())
);

CREATE POLICY "Asset owners can manage royalties" ON asset_royalties FOR ALL USING (
  EXISTS (SELECT 1 FROM assets WHERE id = asset_royalties.asset_id AND user_id = auth.uid())
);

-- Licenses policies (public read for platform default)
CREATE POLICY "Anyone can view non-deleted licenses" ON licenses FOR SELECT USING (NOT is_deleted);

-- Asset licenses policies
CREATE POLICY "Anyone can view active asset licenses" ON asset_licenses FOR SELECT USING (NOT is_deleted AND is_active);
CREATE POLICY "Asset owners can manage licenses" ON asset_licenses FOR ALL USING (
  EXISTS (SELECT 1 FROM assets WHERE id = asset_licenses.asset_id AND user_id = auth.uid())
);

-- Asset license acceptances policies
CREATE POLICY "Users can view their acceptances" ON asset_license_acceptances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create acceptances" ON asset_license_acceptances FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies (public read for marketplace)
CREATE POLICY "Anyone can view non-deleted products" ON products FOR SELECT USING (NOT is_deleted);

-- Product categories policies
CREATE POLICY "Anyone can view product categories" ON product_categories FOR SELECT USING (NOT is_deleted);

-- Product to categories policies
CREATE POLICY "Anyone can view product categorization" ON product_to_product_categories FOR SELECT USING (true);

-- Product teams policies
CREATE POLICY "Team members can view product teams" ON product_teams FOR SELECT USING (
  NOT is_deleted AND EXISTS (SELECT 1 FROM team_users WHERE team_id = product_teams.team_id AND user_id = auth.uid())
);

-- Product variants policies
CREATE POLICY "Anyone can view non-deleted variants" ON product_variants FOR SELECT USING (NOT is_deleted);

-- Product variant assets policies
CREATE POLICY "Anyone can view variant assets" ON product_variant_assets FOR SELECT USING (true);

-- Product variant images policies
CREATE POLICY "Anyone can view visible variant images" ON product_variant_images FOR SELECT USING (NOT is_deleted AND visible);

-- Product prices policies
CREATE POLICY "Anyone can view non-deleted prices" ON product_prices FOR SELECT USING (NOT is_deleted);

-- Product ratings policies
CREATE POLICY "Anyone can view non-deleted ratings" ON product_ratings FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Users can create their own ratings" ON product_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON product_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Asset to products policies
CREATE POLICY "Anyone can view asset-product relationships" ON asset_to_products FOR SELECT USING (true);

-- Stripe prices policies (public read for transparency)
CREATE POLICY "Anyone can view platform fees" ON stripe_prices FOR SELECT USING (NOT is_deleted);

-- Sales policies
CREATE POLICY "Users can view their own sales" ON sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sales" ON sales FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sale items policies
CREATE POLICY "Users can view their own sale items" ON sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_items.sale_id AND user_id = auth.uid())
);

-- Sale item assets policies
CREATE POLICY "Users can view their purchased assets" ON sale_item_assets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE si.id = sale_item_assets.sale_item_id AND s.user_id = auth.uid()
  )
);

-- Sale royalty transactions policies
CREATE POLICY "Recipients can view their royalty payments" ON sale_royalty_transactions FOR SELECT USING (
  auth.uid() = recipient_user_id
);

-- Sale license transactions policies
CREATE POLICY "Buyers can view their license grants" ON sale_license_transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE si.id = sale_license_transactions.sale_item_id AND s.user_id = auth.uid()
  )
);

-- Audit logs policies (users can only see their own actions)
CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA: Platform Default License
-- ============================================================================

INSERT INTO licenses (id, title, version, agreement, tags, created_at, updated_at, is_deleted, deleted_at)
VALUES (
  gen_random_uuid(),
  'Platform Default License',
  '1.0',
  'This is the default platform license. Assets licensed under this agreement may be used in products created and sold exclusively on this platform. Commercial use outside the platform is prohibited without separate licensing arrangements.',
  'default,platform,commercial',
  NOW(),
  NOW(),
  FALSE,
  NULL
);
