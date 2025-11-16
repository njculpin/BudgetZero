import type { BaseEntity, BaseEntityWithoutDelete } from "./common.types";

export interface User extends BaseEntity {
  handle: string;
  email: string;
  name: string;
  bio: string;
  avatar_url: string;
  stripe_account_id: string;
  stripe_customer_id: string;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarded: boolean;
  stripe_connect_details_submitted: boolean;
  stripe_connect_charges_enabled: boolean;
  stripe_connect_payouts_enabled: boolean;
}

export interface UserTag extends BaseEntity {
  user_id: string;
  value: string;
}

export interface UserReview extends BaseEntity {
  user_id: string;
  reviewer_id: string;
  review_rating: number;
  review_text: string;
}

export interface UserFollows extends BaseEntityWithoutDelete {
  follower_id: string;
  following_id: string;
}
