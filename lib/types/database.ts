// Database types for Workshop platform
import type { JSONContent } from "@tiptap/core";

export type CreatorRole =
  | "designer"
  | "illustrator"
  | "modeler"
  | "editor"
  | "photographer";
export type ProjectStatus = "draft" | "active" | "archived" | "published";
export type CollaborationPermission = "read" | "comment" | "edit" | "admin";
export type LicenseType = "free" | "attribution" | "commercial" | "exclusive";
export type InvitationStatus = "pending" | "accepted" | "declined" | "revoked";
export type ProjectRelationshipType = "fork" | "merge" | "component";
export type MergeStatus = "proposed" | "accepted" | "declined" | "completed";
export type AssetType =
  | "model"
  | "illustration"
  | "photo"
  | "texture"
  | "audio";
export type ActivityType =
  | "project_created"
  | "project_updated"
  | "collaborator_added"
  | "asset_added"
  | "rulebook_updated"
  | "comment_added";
export type ResourceType = "project" | "rulebook" | "asset" | "collaboration";
export type ExperienceLevel = "beginner" | "intermediate" | "expert";

// Profile interfaces
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  creator_roles: CreatorRole[];
  location: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  social_links: Record<string, string>;
  skills: string[];
  experience_level: ExperienceLevel | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  bio?: string;
  creator_roles?: CreatorRole[];
  location?: string;
  website_url?: string;
  portfolio_url?: string;
  social_links?: Record<string, string>;
  skills?: string[];
  experience_level?: ExperienceLevel;
}

export interface UpdateProfileData {
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  creator_roles?: CreatorRole[];
  location?: string;
  website_url?: string;
  portfolio_url?: string;
  social_links?: Record<string, string>;
  skills?: string[];
  experience_level?: ExperienceLevel;
}

// Game project interfaces
export interface GameProject {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  creator_id: string;
  status: ProjectStatus;
  is_public: boolean;
  cover_image_url: string | null;
  tags: string[];
  license_type: LicenseType;
  license_terms: string | null;
  price_cents: number;
  revenue_split_percentage: number;
  genre: string | null;
  player_count_min: number | null;
  player_count_max: number | null;
  play_time_minutes: number | null;
  complexity_rating: number | null;
  seeking_collaborators: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameProjectWithCreator extends GameProject {
  creator: Profile;
}

export interface GameProjectWithCollaborators extends GameProjectWithCreator {
  collaborators: ProjectCollaborator[];
}

export interface CreateGameProjectData {
  title: string;
  description?: string;
  slug: string;
  creator_id: string;
  is_public?: boolean;
  tags?: string[];
  license_type?: LicenseType;
  license_terms?: string;
  price_cents?: number;
  genre?: string;
  player_count_min?: number;
  player_count_max?: number;
  play_time_minutes?: number;
  complexity_rating?: number;
  seeking_collaborators?: boolean;
}

export interface UpdateGameProjectData {
  title?: string;
  description?: string;
  slug?: string;
  status?: ProjectStatus;
  is_public?: boolean;
  cover_image_url?: string;
  tags?: string[];
  license_type?: LicenseType;
  license_terms?: string;
  price_cents?: number;
  genre?: string;
  player_count_min?: number;
  player_count_max?: number;
  play_time_minutes?: number;
  complexity_rating?: number;
  seeking_collaborators?: boolean;
}

// Project collaboration interfaces
export interface ProjectCollaborator {
  id: string;
  project_id: string;
  collaborator_id: string;
  role: CreatorRole;
  permissions: CollaborationPermission[];
  invitation_status: InvitationStatus;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  revenue_percentage: number;
  contribution_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCollaboratorWithProfile extends ProjectCollaborator {
  collaborator: Profile;
  inviter?: Profile;
}

export interface CreateCollaboratorInviteData {
  project_id: string;
  collaborator_id: string;
  role: CreatorRole;
  permissions: CollaborationPermission[];
  invited_by: string;
  contribution_description?: string;
  revenue_percentage?: number;
}

// Document section interface for structured rulebooks
export interface DocumentSection {
  id: string;
  type: string;
  title: string;
  content: JSONContent;
  order: number;
}

// Rulebook interfaces
export interface Rulebook {
  id: string;
  project_id: string;
  title: string;
  content: JSONContent;
  sections?: DocumentSection[];
  version: number;
  is_published: boolean;
  word_count: number;
  page_count: number;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RulebookWithProject extends Rulebook {
  project: GameProject;
}

export interface RulebookVersion {
  id: string;
  rulebook_id: string;
  version_number: number;
  content: JSONContent;
  changes_summary: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateRulebookData {
  project_id: string;
  title?: string;
  content?: JSONContent;
}

export interface UpdateRulebookData {
  title?: string;
  content?: JSONContent;
  last_edited_by: string;
}

// Asset interfaces
export interface Asset {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  asset_type: AssetType;
  file_url: string;
  file_size_bytes: number | null;
  file_format: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  dimensions: Record<string, any> | null;
  tags: string[];
  license_type: LicenseType;
  license_terms: string | null;
  price_cents: number;
  royalty_percentage: number;
  download_count: number;
  usage_count: number;
  is_public: boolean;
  is_featured: boolean;
  seeking_collaborators?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetFile {
  id: string;
  asset_id: string;
  file_type:
    | "primary"
    | "texture"
    | "material"
    | "thumbnail"
    | "preview"
    | "additional";
  file_url: string;
  file_name: string;
  file_format: string | null;
  file_size_bytes: number | null;
  display_order: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AssetWithFiles extends Asset {
  files: AssetFile[];
}

export interface AssetWithCreator extends Asset {
  creator: Profile;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  asset_id: string;
  usage_context: string | null;
  added_by: string;
  added_at: string;
}

export interface ProjectAssetWithAsset extends ProjectAsset {
  asset: AssetWithCreator;
  added_by_profile: Profile;
}

export interface CreateAssetData {
  creator_id: string;
  title: string;
  description?: string;
  asset_type: AssetType;
  file_url: string;
  file_size_bytes?: number;
  file_format?: string;
  thumbnail_url?: string;
  preview_url?: string;
  dimensions?: Record<string, any>;
  tags?: string[];
  license_type?: LicenseType;
  license_terms?: string;
  price_cents?: number;
  is_public?: boolean;
  seeking_collaborators?: boolean;
}

// Activity and comments interfaces
export interface Activity {
  id: string;
  actor_id: string;
  action_type: ActivityType;
  resource_type: ResourceType;
  resource_id: string;
  project_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityWithActor extends Activity {
  actor: Profile;
}

export interface Comment {
  id: string;
  author_id: string;
  resource_type: ResourceType;
  resource_id: string;
  parent_id: string | null;
  content: string;
  is_resolved: boolean;
  position: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: Profile;
  replies?: CommentWithAuthor[];
}

export interface CreateCommentData {
  author_id: string;
  resource_type: ResourceType;
  resource_id: string;
  parent_id?: string;
  content: string;
  position?: Record<string, any>;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form validation schemas (for use with Zod)
export interface ProjectFormData {
  title: string;
  description?: string;
  genre?: string;
  player_count_min?: number;
  player_count_max?: number;
  play_time_minutes?: number;
  complexity_rating?: number;
  tags: string[];
  is_public: boolean;
  license_type: LicenseType;
  license_terms?: string;
  price_cents?: number;
}

export interface CollaboratorInviteFormData {
  email: string;
  role: CreatorRole;
  permissions: CollaborationPermission[];
  contribution_description?: string;
  revenue_percentage?: number;
}

export interface ProfileFormData {
  full_name: string;
  username: string;
  bio?: string;
  creator_roles: CreatorRole[];
  location?: string;
  website_url?: string;
  portfolio_url?: string;
  skills: string[];
  experience_level: ExperienceLevel;
}

// Project relationship and merging interfaces
export interface ProjectRelationship {
  id: string;
  parent_project_id: string;
  child_project_id: string;
  relationship_type: ProjectRelationshipType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectRelationshipWithProjects extends ProjectRelationship {
  parent_project: GameProject;
  child_project: GameProject;
  creator: Profile;
}

export interface ProjectMergeProposal {
  id: string;
  target_project_id: string; // The main project being merged into
  source_project_ids: string[]; // Array of project IDs being merged
  proposed_by: string;
  proposed_title: string;
  proposed_description: string | null;
  merge_status: MergeStatus;
  revenue_split: Record<string, number>; // user_id -> percentage
  merge_terms: string | null;
  requires_approval_from: string[]; // Array of user IDs who need to approve
  approved_by: string[]; // Array of user IDs who have approved
  declined_by: string[]; // Array of user IDs who have declined
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMergeProposalWithProjects extends ProjectMergeProposal {
  target_project: GameProjectWithCreator;
  source_projects: GameProjectWithCreator[];
  proposer: Profile;
  approvers: Profile[];
  decliners: Profile[];
}

export interface CreateProjectMergeProposalData {
  target_project_id: string;
  source_project_ids: string[];
  proposed_by: string;
  proposed_title: string;
  proposed_description?: string;
  revenue_split: Record<string, number>;
  merge_terms?: string;
}

// Yjs collaboration document for real-time editing
export interface CollaborationDocument {
  id: string;
  project_id: string;
  document_type: "rulebook" | "description" | "notes";
  yjs_document_id: string; // Reference to Yjs document
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 4.2 - Project Forking and Collaborative Projects

export type ForkType = "merge" | "reference";
export type ForkStatus = "pending" | "accepted" | "rejected" | "expired";
export type CollaborativeProjectStatus =
  | "draft"
  | "review"
  | "published"
  | "archived";
export type CollaborativeMemberRole = "owner" | "contributor";

export interface ProjectFork {
  id: string;
  parent_project_id: string;
  child_project_id: string;
  fork_type: ForkType;
  status: ForkStatus;
  requested_by: string;
  requested_at: string;
  responded_at: string | null;
  message: string | null;
}

export interface ProjectForkWithProjects extends ProjectFork {
  parent_project: GameProject;
  child_project: GameProject;
  requester: Profile;
}

export interface CollaborativeProject {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  source_project_ids: string[];
  status: CollaborativeProjectStatus;
  revenue_split: Record<string, number>;
  requires_unanimous_approval: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CollaborativeProjectMember {
  id: string;
  collaborative_project_id: string;
  user_id: string;
  source_project_id: string | null;
  role: CollaborativeMemberRole;
  revenue_percentage: number;
  joined_at: string;
}

export interface CollaborativeProjectMemberWithProfile
  extends CollaborativeProjectMember {
  user: Profile;
  source_project?: GameProject;
}

export interface CollaborativeProjectApproval {
  id: string;
  collaborative_project_id: string;
  approver_id: string;
  approved: boolean | null;
  approved_at: string | null;
  comments: string | null;
  created_at: string;
}

export interface CollaborativeProjectApprovalWithProfile
  extends CollaborativeProjectApproval {
  approver: Profile;
}

export interface CollaborativeProjectWithDetails extends CollaborativeProject {
  members: CollaborativeProjectMemberWithProfile[];
  approvals: CollaborativeProjectApprovalWithProfile[];
  source_projects: GameProject[];
  creator: Profile;
}

export interface CreateProjectForkData {
  parent_project_id: string;
  child_project_id: string;
  fork_type: ForkType;
  message?: string;
}

export interface CreateCollaborativeProjectData {
  name: string;
  description?: string;
  source_project_ids: string[];
  revenue_split: Record<string, number>;
}

// Attribution reference interfaces
export interface ProjectAssetReference {
  id: string;
  project_id: string;
  asset_id: string;
  royalty_percentage: number;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface ProjectDocumentReference {
  id: string;
  project_id: string;
  document_id: string;
  royalty_percentage: number;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
}

// Enriched reference types (with joined data)
export interface EnrichedAssetReference {
  id: string;
  royalty_percentage: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  asset: {
    id: string;
    title: string;
    asset_type: string;
    thumbnail_url: string | null;
    creator_id: string;
    creator?: {
      id: string;
      full_name: string | null;
    };
  };
  project: {
    id: string;
    title: string;
    slug: string;
    creator_id: string;
    creator: {
      id: string;
      full_name: string | null;
    };
  };
}

export interface EnrichedDocumentReference {
  id: string;
  royalty_percentage: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  document: {
    id: string;
    title: string;
    document_type: string;
    creator_id: string;
  };
  project: {
    id: string;
    title: string;
    slug: string;
    creator_id: string;
    creator: {
      id: string;
      full_name: string | null;
    };
  };
}
