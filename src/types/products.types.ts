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
  is_embeddable: boolean;
  cover_image_url?: string | null;
  price_cents?: number | null;
  embedding_royalty_cents?: number | null;
  file_count?: number;
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
  price_cents: number;
}

// Product Documents (documents attached to products with pricing)
export interface ProductDocument extends BaseEntity {
  product_id: string;
  document_id: string;
  price_cents: number;
  position: number;
  pdf_url: string | null;
  pdf_storage_path: string | null;
  pdf_generated_at: string | null;
}

// Product Components (product-level embedding for collaborative products)
export interface ProductComponent extends BaseEntity {
  parent_product_id: string; // The product that embeds another product
  child_product_id: string; // The product being embedded
  inherited_price_cents: number; // Price inherited from embedded product at link time
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
