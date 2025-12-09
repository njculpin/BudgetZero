import type { BaseEntity } from "./common.types";

export type ProductStatus = "draft" | "private" | "public" | "archived";
export type ProductCollaboratorRole = "owner" | "editor" | "viewer";
export type RoyaltyType = 'fixed' | 'percentage';

export interface Product extends BaseEntity {
  handle: string;
  title: string;
  user_id: string;
  description: string;
  status: ProductStatus;
  view_count: number;
  public_at: string | null;
  needs_attention: boolean;
  attention_reason: string | null;
  attention_since: string | null;
  // Product-as-component fields (replaces Asset functionality)
  is_embeddable: boolean; // Can this product be embedded in other products?
  direct_sale_price_cents: number | null; // Price when sold directly to customers
  embedding_royalty_cents: number | null; // Royalty when embedded in another product
  download_count: number;
  total_size_bytes: number;
  file_count: number;
}

export interface ProductCollaborator extends BaseEntity {
  product_id: string;
  user_id: string;
  role: ProductCollaboratorRole;
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
}

export interface ProductImage extends BaseEntity {
  product_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  position: number;
}

export interface ProductVariant extends BaseEntity {
  product_id: string;
  title: string;
  description: string;
  sku: string;
  is_digital: boolean;
  options: Record<string, unknown>;
  position: number;
}

export interface ProductVariantPrice extends BaseEntity {
  variant_id: string;
  currency: string;
  unit_amount: number;
  min_quantity: number;
  max_quantity: number | null;
}

export interface ProductPriceBreak extends BaseEntity {
  price_id: string;
  min_quantity: number;
  max_quantity: number;
  amount_cents: number;
  currency: string;
}

export interface ProductVariantImage extends BaseEntity {
  product_id: string;
  variant_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  position: number;
}

// Product Files (replaces AssetFile)
export interface ProductFile extends BaseEntity {
  product_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  position: number;
}

// Product Components (replaces ProductAsset for product-in-product relationships)
export interface ProductComponent extends BaseEntity {
  parent_variant_id: string; // The variant that contains this component
  child_product_id: string; // The product being embedded
  royalty_amount_cents: number; // Royalty amount captured at link time
}

// Product Royalties (replaces AssetRoyalty)
export interface ProductRoyalty extends BaseEntity {
  product_id: string;
  user_id: string;
  royalty_type: RoyaltyType;
  royalty_value: number; // Fixed: cents | Percentage: 0-100
}

export interface ProductReview extends BaseEntity {
  user_id: string;
  product_id: string;
  review_rating: number;
  review_text: string;
}

export interface ProductChatMessage extends BaseEntity {
  product_id: string;
  user_id: string;
  message: string;
}

export interface ProductChatMessageReaction extends BaseEntity {
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface ProductChatMessageAttachment extends BaseEntity {
  message_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
}

export interface ProductTag extends BaseEntity {
  product_id: string;
  value: string;
}
