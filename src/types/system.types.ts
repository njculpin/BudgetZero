import type { BaseEntity, BaseEntityWithoutDelete } from "./common.types";

export type NotificationEntityType = 'user' | 'document' | 'product' | 'sale';
export type NotificationDeliveryType = 'push' | 'email' | 'inapp';
export type NotificationActionType =
  | 'product_needs_review'
  | 'product_price_conflict'
  | 'sale_completed'
  | 'royalty_payment_received'
  | 'document_shared'
  | 'general';

export type ActivityEntityType = 'user' | 'document' | 'product' | 'sale';
export type ActivityActionType = 'created' | 'updated' | 'deleted' | 'public' | 'purchased' | 'reviewed';
export type VerificationTokenType = 'email_verification' | 'password_reset';

export interface License extends BaseEntity {
  title: string;
  version: number;
  agreement: string;
}

export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message: string;
  entity_type: NotificationEntityType;
  entity_id: string;
  action_type: NotificationActionType;
  snapshot: Record<string, unknown>;
  delivery_type: NotificationDeliveryType;
  read: boolean;
  read_at: string | null;
}

export interface NotificationSettings extends BaseEntityWithoutDelete {
  user_id: string;
  // Email preferences
  email_product_conflicts: boolean;
  email_sales: boolean;
  email_royalty_payments: boolean;
  email_document_shares: boolean;
  email_marketing: boolean;
  // In-app preferences
  inapp_product_conflicts: boolean;
  inapp_sales: boolean;
  inapp_royalty_payments: boolean;
  inapp_document_shares: boolean;
  // Push preferences (future)
  push_enabled: boolean;
  push_sales: boolean;
  push_royalty_payments: boolean;
}

export interface ActivityFeed extends BaseEntityWithoutDelete {
  user_id: string;
  entity_type: ActivityEntityType;
  entity_id: string;
  action_type: ActivityActionType;
  snapshot: Record<string, unknown>;
}

export interface Session extends BaseEntityWithoutDelete {
  user_id: string;
  token: string;
  expires_at: string;
}

export interface VerificationToken extends BaseEntityWithoutDelete {
  user_id: string;
  token: string;
  type: VerificationTokenType;
  expires_at: string;
}

export interface StripeWebhookEvent extends BaseEntityWithoutDelete {
  stripe_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
}

export interface LogEvent extends BaseEntityWithoutDelete {
  title: string;
  message: string;
  entity_type: NotificationEntityType;
  snapshot: Record<string, unknown>;
}
