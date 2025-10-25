import type { BaseEntity, BaseEntityWithoutDelete } from "./common.types";

export interface User extends BaseEntity {
  handle: string;
  email: string;
  name: string;
  bio: string;
  avatar_url: string;
  stripe_account_id: string;
  stripe_customer_id: string;
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
