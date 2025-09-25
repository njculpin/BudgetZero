import { z } from 'zod';

// Enum schemas
export const CreatorRoleSchema = z.enum(['designer', 'illustrator', 'modeler', 'editor', 'photographer']);
export const ProjectStatusSchema = z.enum(['draft', 'active', 'archived', 'published']);
export const CollaborationPermissionSchema = z.enum(['read', 'comment', 'edit', 'admin']);
export const LicenseTypeSchema = z.enum(['free', 'attribution', 'commercial', 'exclusive']);
export const ExperienceLevelSchema = z.enum(['beginner', 'intermediate', 'expert']);
export const AssetTypeSchema = z.enum(['model', 'illustration', 'photo', 'texture', 'audio']);

// Helper function to create slug from title
export const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Profile validation schemas
export const CreateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  bio: z.string().max(500, 'Bio too long').optional(),
  creator_roles: z.array(CreatorRoleSchema).min(1, 'Select at least one creator role'),
  location: z.string().max(100, 'Location too long').optional(),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
  skills: z.array(z.string()).default([]),
  experience_level: ExperienceLevelSchema,
});

export const UpdateProfileSchema = CreateProfileSchema.partial();

// Game project validation schemas
export const CreateGameProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  genre: z.string().max(50, 'Genre too long').optional(),
  player_count_min: z.number().min(1, 'Minimum players must be at least 1').optional(),
  player_count_max: z.number().min(1, 'Maximum players must be at least 1').optional(),
  play_time_minutes: z.number().min(1, 'Play time must be at least 1 minute').optional(),
  complexity_rating: z.number().min(1, 'Complexity rating must be 1-5').max(5, 'Complexity rating must be 1-5').optional(),
  tags: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
  license_type: LicenseTypeSchema.default('free'),
  license_terms: z.string().max(1000, 'License terms too long').optional(),
  price_cents: z.number().min(0, 'Price cannot be negative').default(0),
}).refine((data) => {
  // Validate player count relationship
  if (data.player_count_min && data.player_count_max) {
    return data.player_count_max >= data.player_count_min;
  }
  return true;
}, {
  message: 'Maximum players must be greater than or equal to minimum players',
  path: ['player_count_max'],
});

export const UpdateGameProjectSchema = CreateGameProjectSchema.partial().extend({
  status: ProjectStatusSchema.optional(),
});

// Collaboration validation schemas
export const CreateCollaboratorInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: CreatorRoleSchema,
  permissions: z.array(CollaborationPermissionSchema).min(1, 'Select at least one permission'),
  contribution_description: z.string().max(500, 'Contribution description too long').optional(),
  revenue_percentage: z.number()
    .min(0, 'Revenue percentage cannot be negative')
    .max(100, 'Revenue percentage cannot exceed 100')
    .default(0),
});

export const AcceptCollaboratorInviteSchema = z.object({
  invitation_id: z.string().uuid('Invalid invitation ID'),
});

// Rulebook validation schemas
export const CreateRulebookSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').default('Untitled Rulebook'),
  content: z.any().optional(), // TipTap JSON content
});

export const UpdateRulebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  content: z.any().optional(), // TipTap JSON content
});

// Asset validation schemas
export const CreateAssetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  asset_type: AssetTypeSchema,
  file_url: z.string().url('Invalid file URL'),
  file_size_bytes: z.number().min(0, 'File size cannot be negative').optional(),
  file_format: z.string().max(20, 'File format too long').optional(),
  thumbnail_url: z.string().url('Invalid thumbnail URL').optional(),
  preview_url: z.string().url('Invalid preview URL').optional(),
  dimensions: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),
  license_type: LicenseTypeSchema.default('attribution'),
  license_terms: z.string().max(1000, 'License terms too long').optional(),
  price_cents: z.number().min(0, 'Price cannot be negative').default(0),
  is_public: z.boolean().default(true),
});

export const UpdateAssetSchema = CreateAssetSchema.partial();

// Comment validation schemas
export const CreateCommentSchema = z.object({
  resource_type: z.enum(['project', 'rulebook', 'asset']),
  resource_id: z.string().uuid('Invalid resource ID'),
  parent_id: z.string().uuid('Invalid parent comment ID').optional(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
  position: z.record(z.any()).optional(), // For contextual comments in editor
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

// Search and filter schemas
export const ProjectSearchSchema = z.object({
  query: z.string().optional(),
  genre: z.string().optional(),
  creator_roles: z.array(CreatorRoleSchema).optional(),
  tags: z.array(z.string()).optional(),
  license_type: LicenseTypeSchema.optional(),
  complexity_rating: z.number().min(1).max(5).optional(),
  player_count_min: z.number().min(1).optional(),
  player_count_max: z.number().min(1).optional(),
  play_time_min: z.number().min(1).optional(),
  play_time_max: z.number().min(1).optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'popularity']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const AssetSearchSchema = z.object({
  query: z.string().optional(),
  asset_type: AssetTypeSchema.optional(),
  license_type: LicenseTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  creator_id: z.string().uuid().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'download_count', 'usage_count']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// API parameter schemas
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const UUIDSchema = z.string().uuid('Invalid ID format');

// Form data types (for use in components)
export type CreateProfileFormData = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileFormData = z.infer<typeof UpdateProfileSchema>;
export type CreateGameProjectFormData = z.infer<typeof CreateGameProjectSchema>;
export type UpdateGameProjectFormData = z.infer<typeof UpdateGameProjectSchema>;
export type CreateCollaboratorInviteFormData = z.infer<typeof CreateCollaboratorInviteSchema>;
export type CreateRulebookFormData = z.infer<typeof CreateRulebookSchema>;
export type UpdateRulebookFormData = z.infer<typeof UpdateRulebookSchema>;
export type CreateAssetFormData = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetFormData = z.infer<typeof UpdateAssetSchema>;
export type CreateCommentFormData = z.infer<typeof CreateCommentSchema>;
export type ProjectSearchFormData = z.infer<typeof ProjectSearchSchema>;
export type AssetSearchFormData = z.infer<typeof AssetSearchSchema>;