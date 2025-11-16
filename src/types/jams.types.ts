import type { BaseEntity } from "./common.types";

export type JamStatus = "upcoming" | "active" | "ended";

export type VotingPhase =
  | "upcoming"
  | "active"
  | "voting"
  | "results_pending"
  | "completed";

export interface Jam extends BaseEntity {
  handle: string;
  title: string;
  description: string;
  rules: string;
  user_id: string;
  status: JamStatus;
  start_date: string;
  end_date: string;
  voting_end_date: string | null;
  results_reveal_date: string | null;
  preview_image_url: string | null;
  preview_image_storage_path: string | null;
  preview_image_mime_type: string | null;
}

export interface JamAttachment extends BaseEntity {
  jam_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
}

export interface JamPrize extends BaseEntity {
  jam_id: string;
  title: string;
  description: string;
}

export interface JamPrizeAttachment extends BaseEntity {
  prize_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
}

export interface JamProduct extends BaseEntity {
  jam_id: string;
  product_id: string;
}

export interface JamProductReview extends BaseEntity {
  jam_id: string;
  user_id: string;
  product_id: string;
  review_rating: number;
  review_text: string;
}

export interface JamCategory extends BaseEntity {
  jam_id: string;
  title: string;
  description: string;
  position: number;
  locked: boolean;
}

export interface JamVote {
  id: string;
  jam_id: string;
  category_id: string;
  user_id: string;
  product_id: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JamVotingStatus {
  jam_id: string;
  voting_open: boolean;
  voting_start: string | null;
  voting_end: string | null;
  user_has_voted: boolean;
  results_visible: boolean;
}

export interface CategoryVotingResult {
  category: JamCategory;
  products: Array<{
    product_id: string;
    vote_count: number;
    rank: number;
  }>;
}
