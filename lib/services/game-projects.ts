import { SupabaseClient } from '@supabase/supabase-js';
import {
  GameProject,
  GameProjectWithCreator,
  GameProjectWithCollaborators,
  CreateGameProjectData,
  UpdateGameProjectData,
  ApiResponse,
  PaginatedResponse
} from '@/lib/types/database';
import { CreateGameProjectSchema, UpdateGameProjectSchema, createSlug } from '@/lib/validations/schemas';

export class GameProjectService {
  constructor(private supabase: SupabaseClient) {}

  async createProject(userId: string, projectData: Omit<CreateGameProjectData, 'creator_id' | 'slug'>): Promise<ApiResponse<GameProject>> {
    try {
      // Validate input data
      const validatedData = CreateGameProjectSchema.parse(projectData);

      // Generate slug from title
      const baseSlug = createSlug(validatedData.title);
      let slug = baseSlug;
      let slugCounter = 1;

      // Ensure slug is unique
      while (true) {
        const { data: existingProject } = await this.supabase
          .from('game_projects')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!existingProject) break;
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }

      const { data, error } = await this.supabase
        .from('game_projects')
        .insert([{
          ...validatedData,
          creator_id: userId,
          slug,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return { error: 'Failed to create project' };
      }

      // Create initial rulebook for the project
      await this.supabase
        .from('rulebooks')
        .insert([{
          project_id: data.id,
          title: `${data.title} Rulebook`,
          content: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: data.title }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Start writing your game rules here...' }]
              }
            ]
          },
          last_edited_by: userId,
        }]);

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Validation error:', error.message);
        return { error: error.message };
      }
      console.error('Unexpected error creating project:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getProject(projectId: string): Promise<ApiResponse<GameProjectWithCreator>> {
    try {
      const { data, error } = await this.supabase
        .from('game_projects')
        .select(`
          *,
          creator:profiles!creator_id (*)
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return { error: 'Project not found' };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching project:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getProjectBySlug(slug: string): Promise<ApiResponse<GameProjectWithCreator>> {
    try {
      const { data, error } = await this.supabase
        .from('game_projects')
        .select(`
          *,
          creator:profiles!creator_id (*)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching project by slug:', error);
        return { error: 'Project not found' };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching project:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getProjectWithCollaborators(projectId: string): Promise<ApiResponse<GameProjectWithCollaborators>> {
    try {
      const { data, error } = await this.supabase
        .from('game_projects')
        .select(`
          *,
          creator:profiles!creator_id (*),
          collaborators:project_collaborators!project_id (
            *,
            collaborator:profiles!collaborator_id (*)
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project with collaborators:', error);
        return { error: 'Project not found' };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching project:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async updateProject(projectId: string, userId: string, updates: UpdateGameProjectData): Promise<ApiResponse<GameProject>> {
    try {
      const validatedData = UpdateGameProjectSchema.parse(updates);

      // Update slug if title changed
      if (validatedData.title) {
        const baseSlug = createSlug(validatedData.title);
        let slug = baseSlug;
        let slugCounter = 1;

        // Ensure slug is unique (excluding current project)
        while (true) {
          const { data: existingProject } = await this.supabase
            .from('game_projects')
            .select('id')
            .eq('slug', slug)
            .neq('id', projectId)
            .single();

          if (!existingProject) break;
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        validatedData.slug = slug;
      }

      const { data, error } = await this.supabase
        .from('game_projects')
        .update(validatedData)
        .eq('id', projectId)
        .eq('creator_id', userId) // Ensure only creator can update
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return { error: 'Failed to update project' };
      }

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Validation error:', error.message);
        return { error: error.message };
      }
      console.error('Unexpected error updating project:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getUserProjects(userId: string, page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<GameProjectWithCreator>>> {
    try {
      const offset = (page - 1) * limit;

      // Get total count for projects user created
      const { count: createdCount } = await this.supabase
        .from('game_projects')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Get total count for projects user collaborates on
      const { count: collaboratedCount } = await this.supabase
        .from('project_collaborators')
        .select('project_id', { count: 'exact', head: true })
        .eq('collaborator_id', userId)
        .eq('invitation_status', 'accepted')
        .eq('is_active', true);

      const totalCount = (createdCount || 0) + (collaboratedCount || 0);

      // Get projects user created
      const { data: createdProjects } = await this.supabase
        .from('game_projects')
        .select(`
          *,
          creator:profiles!creator_id (*)
        `)
        .eq('creator_id', userId);

      // Get project IDs user collaborates on
      const { data: collaboratorProjectIds } = await this.supabase
        .from('project_collaborators')
        .select('project_id')
        .eq('collaborator_id', userId)
        .eq('invitation_status', 'accepted')
        .eq('is_active', true);

      // Get projects user collaborates on
      let collaboratedProjects = [];
      if (collaboratorProjectIds && collaboratorProjectIds.length > 0) {
        const projectIds = collaboratorProjectIds.map(item => item.project_id);
        const { data } = await this.supabase
          .from('game_projects')
          .select(`
            *,
            creator:profiles!creator_id (*)
          `)
          .in('id', projectIds);
        collaboratedProjects = data || [];
      }

      // Combine and sort all projects
      const allProjects = [
        ...(createdProjects || []),
        ...collaboratedProjects
      ];

      // Remove duplicates (in case user is both creator and collaborator)
      const uniqueProjects = allProjects.filter((project, index, array) =>
        array.findIndex(p => p.id === project.id) === index
      );

      // Sort by updated_at
      uniqueProjects.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      // Apply pagination
      const paginatedProjects = uniqueProjects.slice(offset, offset + limit);

      return {
        data: {
          data: paginatedProjects,
          count: uniqueProjects.length,
          page,
          limit,
          has_more: uniqueProjects.length > offset + limit
        }
      };
    } catch (error) {
      console.error('Unexpected error fetching user projects:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getPublicProjects(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<GameProjectWithCreator>>> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const { count } = await this.supabase
        .from('game_projects')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .in('status', ['active', 'published']);

      // Get projects
      const { data, error } = await this.supabase
        .from('game_projects')
        .select(`
          *,
          creator:profiles!creator_id (*)
        `)
        .eq('is_public', true)
        .in('status', ['active', 'published'])
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching public projects:', error);
        return { error: 'Failed to fetch projects' };
      }

      return {
        data: {
          data: data || [],
          count: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Unexpected error fetching public projects:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async searchProjects(query: string, filters: {
    genre?: string;
    tags?: string[];
    complexity_rating?: number;
    player_count_min?: number;
    player_count_max?: number;
  } = {}, page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<GameProjectWithCreator>>> {
    try {
      const offset = (page - 1) * limit;

      let queryBuilder = this.supabase
        .from('game_projects')
        .select(`
          *,
          creator:profiles!creator_id (*)
        `)
        .eq('is_public', true)
        .in('status', ['active', 'published']);

      // Add text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,description.ilike.%${query}%`
        );
      }

      // Apply filters
      if (filters.genre) {
        queryBuilder = queryBuilder.eq('genre', filters.genre);
      }
      if (filters.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }
      if (filters.complexity_rating) {
        queryBuilder = queryBuilder.eq('complexity_rating', filters.complexity_rating);
      }
      if (filters.player_count_min) {
        queryBuilder = queryBuilder.gte('player_count_max', filters.player_count_min);
      }
      if (filters.player_count_max) {
        queryBuilder = queryBuilder.lte('player_count_min', filters.player_count_max);
      }

      // Get total count first
      const countQuery = queryBuilder;
      const { count } = await countQuery.select('*', { count: 'exact', head: true });

      // Get projects
      const { data, error } = await queryBuilder
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching projects:', error);
        return { error: 'Failed to search projects' };
      }

      return {
        data: {
          data: data || [],
          count: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Unexpected error searching projects:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async deleteProject(projectId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      // Only creator can delete project
      const { error } = await this.supabase
        .from('game_projects')
        .delete()
        .eq('id', projectId)
        .eq('creator_id', userId);

      if (error) {
        console.error('Error deleting project:', error);
        return { error: 'Failed to delete project' };
      }

      return { data: true };
    } catch (error) {
      console.error('Unexpected error deleting project:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async checkProjectAccess(projectId: string, userId: string): Promise<ApiResponse<{ canRead: boolean; canEdit: boolean; canAdmin: boolean }>> {
    try {
      // Check if user is creator
      const { data: project } = await this.supabase
        .from('game_projects')
        .select('creator_id, is_public')
        .eq('id', projectId)
        .single();

      if (!project) {
        return { error: 'Project not found' };
      }

      if (project.creator_id === userId) {
        return { data: { canRead: true, canEdit: true, canAdmin: true } };
      }

      // Check if project is public (read access)
      if (project.is_public) {
        // Check if user is a collaborator
        const { data: collaboration } = await this.supabase
          .from('project_collaborators')
          .select('permissions')
          .eq('project_id', projectId)
          .eq('collaborator_id', userId)
          .eq('invitation_status', 'accepted')
          .eq('is_active', true)
          .single();

        if (collaboration) {
          const permissions = collaboration.permissions;
          return {
            data: {
              canRead: true,
              canEdit: permissions.includes('edit'),
              canAdmin: permissions.includes('admin')
            }
          };
        }

        return { data: { canRead: true, canEdit: false, canAdmin: false } };
      }

      // Private project - check collaboration
      const { data: collaboration } = await this.supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', projectId)
        .eq('collaborator_id', userId)
        .eq('invitation_status', 'accepted')
        .eq('is_active', true)
        .single();

      if (collaboration) {
        const permissions = collaboration.permissions;
        return {
          data: {
            canRead: true,
            canEdit: permissions.includes('edit'),
            canAdmin: permissions.includes('admin')
          }
        };
      }

      return { data: { canRead: false, canEdit: false, canAdmin: false } };
    } catch (error) {
      console.error('Unexpected error checking project access:', error);
      return { error: 'Unexpected error occurred' };
    }
  }
}