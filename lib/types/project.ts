/**
 * Unified Project Types
 * Supports game, model, and illustration projects
 */

export type ProjectType = "game" | "model" | "illustration";

export type ProjectStatus = "draft" | "active" | "archived" | "published";

export type LicenseType = "free" | "attribution" | "commercial" | "exclusive";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  creator_id: string;
  project_type: ProjectType;
  status: ProjectStatus;
  is_public: boolean;
  cover_image_url: string | null;
  tags: string[];
  license_type: LicenseType;
  license_terms: string | null;
  price_cents: number;

  // Game-specific fields (null for non-game projects)
  genre: string | null;
  player_count_min: number | null;
  player_count_max: number | null;
  play_time_minutes: number | null;
  complexity_rating: number | null;

  created_at: string;
  updated_at: string;
}

export interface ProjectAssetReference {
  id: string;
  project_id: string;
  asset_id: string;
  royalty_percentage: number;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  requested_at: string;
  responded_at: string | null;
  response_message: string | null;
  created_at: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  project_type: ProjectType;
  is_public?: boolean;
  cover_image_url?: string;
  tags?: string[];
  license_type?: LicenseType;
  license_terms?: string;
  price_cents?: number;

  // Game-specific
  genre?: string;
  player_count_min?: number;
  player_count_max?: number;
  play_time_minutes?: number;
  complexity_rating?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
}
