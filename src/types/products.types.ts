import type { BaseEntity } from "./common.types";

export type ProductStatus = "draft" | "published" | "archived";
export type ProductCollaboratorRole = "owner" | "editor" | "viewer";

export interface Product extends BaseEntity {
  handle: string;
  cover_image_url: string | null;
  title: string;
  user_id: string;
  description: string;
  status: ProductStatus;
  view_count: number;
  published_at: string | null;
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

export interface ProductAsset extends BaseEntity {
  product_id: string;
  asset_id: string;
  variant_id: string;
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
