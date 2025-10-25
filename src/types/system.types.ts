import type { BaseEntity, BaseEntityWithoutDelete } from "./common.types";

export type NotificationEntityType = 'user' | 'asset' | 'document' | 'product' | 'sale';
export type NotificationDeliveryType = 'push' | 'email' | 'inapp';
export type ActivityEntityType = 'user' | 'asset' | 'document' | 'product' | 'sale' | 'jam';
export type ActivityActionType = 'created' | 'updated' | 'deleted' | 'published' | 'purchased' | 'reviewed';
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
  snapshot: Record<string, unknown>;
  delivery_type: NotificationDeliveryType;
  read: boolean;
  read_at: string | null;
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
