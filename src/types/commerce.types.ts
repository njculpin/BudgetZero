import type { BaseEntity, BaseEntityWithoutDelete } from "./common.types";
import type { RoyaltyType } from "./products.types";

export type SaleStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'stripe' | 'credits';
export type RoyaltyTransactionStatus = 'pending' | 'ready_to_pay' | 'paid' | 'failed' | 'refunded';

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Cart extends BaseEntityWithoutDelete {
  user_id: string;
}

export interface CartItem extends BaseEntityWithoutDelete {
  cart_id: string;
  product_id: string;
  quantity: number;
}

export interface Sale extends BaseEntity {
  user_id: string;
  user_email: string;
  price_cents: number;
  tax_cents: number;
  currency: string;
  stripe_charge_id: string;
  status: SaleStatus;
  payment_method: PaymentMethod;
  shipping_address: ShippingAddress | null;
  order_notes: string | null;
  refund_reason: string | null;
  completed_at: string | null;
}

export interface SaleItem extends BaseEntity {
  sale_id: string;
  product_id: string;
  price_cents: number;
  currency: string;
  quantity: number;
  snapshot: Record<string, unknown>;
}

export interface SaleRoyaltyTransaction extends BaseEntity {
  sale_id: string;
  sale_item_id: string;
  product_royalty_id: string;
  recipient_user_id: string;
  royalty_type: RoyaltyType;
  royalty_value: number;
  calculated_cents: number;
  status: RoyaltyTransactionStatus;
  stripe_transfer_id: string;
  paid_at: string | null;
}

export interface Wishlist extends BaseEntityWithoutDelete {
  user_id: string;
  product_id: string;
}
