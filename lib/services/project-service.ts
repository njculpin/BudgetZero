import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/lib/types/project";

export class ProjectService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new project (game, model, or illustration)
   */
  async createProject(
    userId: string,
    projectData: CreateProjectInput,
  ): Promise<{ data?: Project; error?: string }> {
    try {
      // Generate slug from title
      const baseSlug = this.createSlug(projectData.title);
      let slug = baseSlug;
      let slugCounter = 1;

      // Ensure slug is unique
      while (true) {
        const { data: existingProject } = await this.supabase
          .from("projects")
          .select("id")
          .eq("slug", slug)
          .single();

        if (!existingProject) break;
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }

      const { data, error } = await this.supabase
        .from("projects")
        .insert([
          {
            ...projectData,
            creator_id: userId,
            slug,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        return { error: "Failed to create project" };
      }

      // Create initial rulebook for game projects
      if (data.project_type === "game") {
        await this.supabase.from("rulebooks").insert([
          {
            project_id: data.id,
            title: `${data.title} Rulebook`,
            content: {
              type: "doc",
              content: [
                {
                  type: "heading",
                  attrs: { level: 1 },
                  content: [{ type: "text", text: data.title }],
                },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Start writing your game rules here...",
                    },
                  ],
                },
              ],
            },
            last_edited_by: userId,
          },
        ]);
      }

      return { data };
    } catch (error) {
      console.error("Error creating project:", error);
      return {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  }

  /**
   * Get project by slug
   */
  async getProjectBySlug(
    slug: string,
  ): Promise<{ data?: Project; error?: string }> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return { error: "Project not found" };
    }

    return { data };
  }

  /**
   * Get projects by type
   */
  async getProjectsByType(
    type: "game" | "model" | "illustration",
    options?: { limit?: number; offset?: number },
  ): Promise<{ data?: Project[]; error?: string; count?: number }> {
    let query = this.supabase
      .from("projects")
      .select("*", { count: "exact" })
      .eq("project_type", type)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      return { error: "Failed to fetch projects" };
    }

    return { data: data || [], count: count || 0 };
  }

  /**
   * Get user's projects
   */
  async getUserProjects(
    userId: string,
    options?: { type?: "game" | "model" | "illustration" },
  ): Promise<{ data?: Project[]; error?: string }> {
    let query = this.supabase
      .from("projects")
      .select("*")
      .eq("creator_id", userId)
      .order("updated_at", { ascending: false });

    if (options?.type) {
      query = query.eq("project_type", options.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user projects:", error);
      return { error: "Failed to fetch projects" };
    }

    return { data: data || [] };
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    userId: string,
    updates: UpdateProjectInput,
  ): Promise<{ data?: Project; error?: string }> {
    // Verify user owns the project
    const { data: project } = await this.supabase
      .from("projects")
      .select("creator_id")
      .eq("id", projectId)
      .single();

    if (!project || project.creator_id !== userId) {
      return { error: "Unauthorized" };
    }

    const { data, error } = await this.supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return { error: "Failed to update project" };
    }

    return { data };
  }

  /**
   * Delete project
   */
  async deleteProject(
    projectId: string,
    userId: string,
  ): Promise<{ error?: string }> {
    // Verify user owns the project
    const { data: project } = await this.supabase
      .from("projects")
      .select("creator_id")
      .eq("id", projectId)
      .single();

    if (!project || project.creator_id !== userId) {
      return { error: "Unauthorized" };
    }

    const { error } = await this.supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return { error: "Failed to delete project" };
    }

    return {};
  }

  /**
   * Create slug from title
   */
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
  }
}
