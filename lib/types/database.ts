// Database types for Workshop platform - Normalized Schema
// Generated from supabase/migrations/20250101000000_initial_workshop_schema.sql

// ============================================================================
// ENUM TYPES
// ============================================================================

export type ProjectStatus = "draft" | "active" | "archived" | "published";
export type AssetStatus = "draft" | "active" | "archived" | "published";
export type InvitationStatus = "pending" | "accepted" | "declined" | "revoked";
export type AddressType = "shipping" | "billing" | "both";
export type LicenseType = "free" | "attribution" | "commercial" | "exclusive";
export type ReferenceStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";
export type PayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
export type NotificationType =
  | "asset_reference_request"
  | "asset_reference_approved"
  | "asset_reference_rejected"
  | "collaborator_invite"
  | "collaborator_joined"
  | "project_published"
  | "order_received"
  | "payout_completed"
  | "payout_failed";
export type PermissionType =
  | "read"
  | "write"
  | "delete"
  | "admin"
  | "manage_collaborators"
  | "manage_pricing";
export type ProductStatus = "draft" | "active" | "archived";

// ============================================================================
// USER TABLES
// ============================================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  is_verified: boolean;
  is_active: boolean;
  total_vp: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: AddressType;
  is_primary: boolean;
  full_name: string;
  company_name: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country_code: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserLink {
  id: string;
  user_id: string;
  title: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROJECT TABLES
// ============================================================================

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  slug: string;
  status: ProjectStatus;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSettings {
  id: string;
  project_id: string;
  is_public: boolean;
  allow_comments: boolean;
  allow_forks: boolean;
  allow_downloads: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectLicense {
  id: string;
  project_id: string;
  license_type: LicenseType;
  license_terms: string | null;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTag {
  id: string;
  project_id: string;
  tag: string;
  created_at: string;
}

export interface ProjectStats {
  id: string;
  project_id: string;
  view_count: number;
  download_count: number;
  like_count: number;
  fork_count: number;
  collaborator_count: number;
  asset_count: number;
  total_revenue_cents: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  invitation_status: InvitationStatus;
  contribution_description: string | null;
  is_active: boolean;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCollaboratorPermission {
  id: string;
  collaborator_id: string;
  permission: PermissionType;
  created_at: string;
}

export interface ProjectCollaboratorRevenueSplit {
  id: string;
  project_id: string;
  collaborator_id: string;
  percentage: number;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ASSET TABLES
// ============================================================================

export interface Asset {
  id: string;
  creator_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}

export interface AssetSettings {
  id: string;
  asset_id: string;
  is_public: boolean;
  is_featured: boolean;
  seeking_collaborators: boolean;
  allow_comments: boolean;
  allow_downloads: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetRoyalty {
  id: string;
  asset_id: string;
  percentage: number;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetLicense {
  id: string;
  asset_id: string;
  license_type: LicenseType;
  license_terms: string | null;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetTag {
  id: string;
  asset_id: string;
  tag: string;
  created_at: string;
}

export interface AssetStats {
  id: string;
  asset_id: string;
  view_count: number;
  download_count: number;
  usage_count: number;
  reference_count: number;
  like_count: number;
  comment_count: number;
  total_revenue_cents: number;
  created_at: string;
  updated_at: string;
}

export interface AssetImage {
  id: string;
  asset_id: string;
  file_url: string;
  file_size_bytes: number | null;
  file_format: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssetFile {
  id: string;
  asset_id: string;
  file_url: string;
  file_size_bytes: number | null;
  file_format: string | null;
  file_name: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LICENSING TABLES
// ============================================================================

export interface License {
  id: string;
  creator_id: string | null;
  title: string;
  agreement: string;
  is_platform_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetLicenseGrant {
  id: string;
  licensor_id: string;
  licensee_id: string;
  asset_id: string;
  license_id: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// RELATIONSHIP TABLES
// ============================================================================

export interface ProjectAssetReference {
  id: string;
  project_id: string;
  asset_id: string;
  asset_royalty_id: string | null;
  status: ReferenceStatus;
  requested_by: string;
  requested_at: string;
  responded_at: string | null;
  response_message: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MARKETPLACE TABLES
// ============================================================================

export interface AssetPricing {
  id: string;
  asset_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectPricing {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  product_id: string;
  variant_id: string;
  currency_code: string;
  subtotal_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderMetadata {
  id: string;
  order_id: string;
  key: string;
  value: string | null;
  created_at: string;
}

export interface OrderRevenueSplit {
  id: string;
  order_id: string;
  recipient_id: string;
  split_type:
    | "platform_fee"
    | "asset_royalty"
    | "collaborator_share"
    | "project_creator";
  resource_id: string | null;
  resource_type: "asset" | "project" | "platform" | null;
  amount_cents: number;
  percentage: number;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NOTIFICATIONS & COMMUNICATION
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string | null;
  resource_type:
    | "project"
    | "asset"
    | "order"
    | "payout"
    | "collaborator"
    | null;
  resource_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AssetComment {
  id: string;
  asset_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectReview {
  id: string;
  project_id: string;
  author_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectChat {
  id: string;
  project_id: string;
  author_id: string;
  message: string;
  created_at: string;
}

// ============================================================================
// STRIPE CONNECT TABLES
// ============================================================================

export interface StripeConnectedAccount {
  id: string;
  user_id: string;
  stripe_account_id: string;
  account_type: "express" | "standard";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  country: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface PayoutSchedule {
  id: string;
  user_id: string;
  enabled: boolean;
  frequency: "weekly" | "biweekly" | "monthly";
  minimum_amount: number;
  day_of_month: number | null;
  last_payout_at: string | null;
  next_payout_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PRODUCT LISTING SYSTEM
// ============================================================================

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  status: ProductStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductProject {
  id: string;
  product_id: string;
  project_id: string;
  display_order: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  file_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCollection {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCollectionItem {
  id: string;
  product_id: string;
  collection_id: string;
  display_order: number;
  created_at: string;
}

export interface ProductTag {
  id: string;
  product_id: string;
  tag: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  name: string;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantPrice {
  id: string;
  variant_id: string;
  currency_code: string;
  amount_cents: number;
  compare_at_amount_cents: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantOption {
  id: string;
  variant_id: string;
  option_name: string;
  option_value: string;
  created_at: string;
}

export interface ProductDigitalFile {
  id: string;
  variant_id: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  file_format: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPrintOption {
  id: string;
  variant_id: string;
  printer_integration_id: string;
  print_template_id: string | null;
  paper_type: string | null;
  finish_type: string | null;
  dimensions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSeo {
  id: string;
  product_id: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ENGAGEMENT TABLES
// ============================================================================

export interface WebhookEvent {
  id: string;
  event: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ============================================================================
// ENRICHED TYPES (WITH JOINS)
// ============================================================================

export interface ProjectWithDetails extends Project {
  creator: User;
  settings: ProjectSettings;
  stats: ProjectStats;
  tags: ProjectTag[];
  licenses: ProjectLicense[];
  collaborators: ProjectCollaborator[];
}

export interface AssetWithDetails extends Asset {
  creator: User;
  settings: AssetSettings;
  stats: AssetStats;
  tags: AssetTag[];
  images: AssetImage[];
  files: AssetFile[];
  royalties: AssetRoyalty[];
  licenses: AssetLicense[];
}

export interface ProjectCollaboratorWithDetails extends ProjectCollaborator {
  user: User;
  permissions: ProjectCollaboratorPermission[];
  revenue_splits: ProjectCollaboratorRevenueSplit[];
}

export interface OrderWithDetails extends Order {
  buyer: User;
  items: OrderRevenueSplit[];
  billing_address: UserAddress | null;
  shipping_address: UserAddress | null;
}

export interface ProductWithDetails extends Product {
  projects: Project[];
  images: ProductImage[];
  tags: ProductTag[];
  collections: ProductCollection[];
  variants: ProductVariantWithDetails[];
  seo: ProductSeo | null;
}

export interface ProductVariantWithDetails extends ProductVariant {
  prices: ProductVariantPrice[];
  options: ProductVariantOption[];
  digital_files: ProductDigitalFile[];
  print_options: ProductPrintOption[];
}

export interface ProductCollectionWithProducts extends ProductCollection {
  products: Product[];
}

export interface EnrichedAssetReference {
  id: string;
  royalty_percentage: number;
  status: ReferenceStatus;
  requested_at: string;
  asset: {
    id: string;
    title: string;
    asset_type: string;
    thumbnail_url: string | null;
    creator_id: string;
  };
  project: {
    id: string;
    title: string;
    slug: string;
    creator_id: string;
    creator: {
      id: string;
      full_name: string | null;
    };
  };
}

// ============================================================================
// CREATE/UPDATE INPUT TYPES
// ============================================================================

export interface CreateUserData {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
}

export interface UpdateUserData {
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
}

export interface CreateProjectData {
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  status?: ProjectStatus;
  cover_image_url?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  slug?: string;
  status?: ProjectStatus;
  cover_image_url?: string;
  published_at?: string;
}

export interface CreateAssetData {
  creator_id: string;
  project_id?: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  status?: AssetStatus;
}

export interface UpdateAssetData {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  status?: AssetStatus;
}

export interface CreateProjectCollaboratorData {
  project_id: string;
  user_id: string;
  invitation_status?: InvitationStatus;
  contribution_description?: string;
  invited_by?: string;
}

export interface UpdateProjectCollaboratorData {
  invitation_status?: InvitationStatus;
  contribution_description?: string;
  is_active?: boolean;
  joined_at?: string;
}

export interface CreateProductData {
  handle: string;
  title: string;
  description?: string;
  status?: ProductStatus;
}

export interface UpdateProductData {
  handle?: string;
  title?: string;
  description?: string;
  status?: ProductStatus;
  is_featured?: boolean;
  published_at?: string;
}

export interface CreateProductVariantData {
  product_id: string;
  sku?: string;
  name: string;
  price_cents: number;
  compare_at_price_cents?: number;
  is_available?: boolean;
}

export interface UpdateProductVariantData {
  sku?: string;
  name?: string;
  price_cents?: number;
  compare_at_price_cents?: number;
  is_available?: boolean;
  display_order?: number;
}

export interface CreateProductCollectionData {
  name: string;
  handle: string;
  description?: string;
  image_url?: string;
}

export interface UpdateProductCollectionData {
  name?: string;
  handle?: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_visible?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page?: number;
  limit?: number;
  offset?: number;
  has_more?: boolean;
}
