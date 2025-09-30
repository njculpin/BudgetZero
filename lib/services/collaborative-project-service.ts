import { createClient } from "@/lib/supabase/server";
import type {
  CollaborativeProject,
  CollaborativeProjectWithDetails,
  CreateCollaborativeProjectData,
  CollaborativeProjectMember,
  CollaborativeProjectApproval,
} from "@/lib/types/database";

export class CollaborativeProjectService {
  /**
   * Create a collaborative project from accepted fork requests
   */
  static async createCollaborativeProject(
    data: CreateCollaborativeProjectData
  ): Promise<{ success: boolean; data?: CollaborativeProject; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("collaborative_projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A project with this name already exists" };
    }

    // Verify all revenue splits add up to 100
    const totalRevenue = Object.values(data.revenue_split).reduce(
      (sum, val) => sum + val,
      0
    );
    if (Math.abs(totalRevenue - 100) > 0.01) {
      return {
        success: false,
        error: `Revenue split must total 100% (currently ${totalRevenue}%)`,
      };
    }

    // Create collaborative project
    const { data: collabProject, error } = await supabase
      .from("collaborative_projects")
      .insert({
        name: data.name,
        description: data.description,
        slug,
        source_project_ids: data.source_project_ids,
        status: "draft",
        revenue_split: data.revenue_split,
        requires_unanimous_approval: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Create members and approvals for each user in revenue split
    const membersPromises = Object.entries(data.revenue_split).map(
      async ([userId, percentage]) => {
        // Find which project this user owns
        const { data: ownedProject } = await supabase
          .from("game_projects")
          .select("id")
          .eq("creator_id", userId)
          .in("id", data.source_project_ids)
          .maybeSingle();

        return supabase.from("collaborative_project_members").insert({
          collaborative_project_id: collabProject.id,
          user_id: userId,
          source_project_id: ownedProject?.id,
          role: "owner",
          revenue_percentage: percentage,
        });
      }
    );

    const approvalsPromises = Object.keys(data.revenue_split).map((userId) =>
      supabase.from("collaborative_project_approvals").insert({
        collaborative_project_id: collabProject.id,
        approver_id: userId,
      })
    );

    await Promise.all([...membersPromises, ...approvalsPromises]);

    return { success: true, data: collabProject };
  }

  /**
   * Get collaborative project with all details
   */
  static async getCollaborativeProject(
    projectId: string
  ): Promise<{ success: boolean; data?: CollaborativeProjectWithDetails; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("collaborative_projects")
      .select(
        `
        *,
        creator:profiles!collaborative_projects_created_by_fkey(*),
        members:collaborative_project_members(
          *,
          user:profiles!collaborative_project_members_user_id_fkey(*),
          source_project:game_projects(*)
        ),
        approvals:collaborative_project_approvals(
          *,
          approver:profiles!collaborative_project_approvals_approver_id_fkey(*)
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch source projects separately
    const { data: sourceProjects } = await supabase
      .from("game_projects")
      .select("*")
      .in("id", data.source_project_ids);

    return {
      success: true,
      data: {
        ...data,
        source_projects: sourceProjects || [],
      } as CollaborativeProjectWithDetails,
    };
  }

  /**
   * Approve or reject a collaborative project
   */
  static async approveCollaborativeProject(
    projectId: string,
    approved: boolean,
    comments?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("collaborative_project_approvals")
      .update({
        approved,
        approved_at: new Date().toISOString(),
        comments,
      })
      .eq("collaborative_project_id", projectId)
      .eq("approver_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if all approvals are in
    const { data: project } = await supabase
      .from("collaborative_projects")
      .select(
        `
        *,
        approvals:collaborative_project_approvals(*)
      `
      )
      .eq("id", projectId)
      .single();

    if (project) {
      const allApproved = project.approvals.every(
        (approval: CollaborativeProjectApproval) => approval.approved === true
      );
      const anyRejected = project.approvals.some(
        (approval: CollaborativeProjectApproval) => approval.approved === false
      );

      if (allApproved && project.status === "draft") {
        // Move to review status
        await supabase
          .from("collaborative_projects")
          .update({ status: "review" })
          .eq("id", projectId);
      } else if (anyRejected) {
        // If anyone rejects, mark as rejected (you could also keep it in draft)
        await supabase
          .from("collaborative_projects")
          .update({ status: "archived" })
          .eq("id", projectId);
      }
    }

    return { success: true };
  }

  /**
   * Publish a collaborative project
   */
  static async publishCollaborativeProject(
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify all approvals are in
    const { data: approvals } = await supabase
      .from("collaborative_project_approvals")
      .select("*")
      .eq("collaborative_project_id", projectId);

    if (!approvals) {
      return { success: false, error: "Could not fetch approvals" };
    }

    const allApproved = approvals.every((approval) => approval.approved === true);

    if (!allApproved) {
      return {
        success: false,
        error: "All co-owners must approve before publishing",
      };
    }

    const { error } = await supabase
      .from("collaborative_projects")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get all collaborative projects for a user
   */
  static async getUserCollaborativeProjects(): Promise<{
    success: boolean;
    data?: CollaborativeProject[];
    error?: string;
  }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("collaborative_projects")
      .select("*")
      .or(`created_by.eq.${user.id},members.user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Update collaborative project
   */
  static async updateCollaborativeProject(
    projectId: string,
    updates: Partial<Pick<CollaborativeProject, "name" | "description" | "revenue_split">>
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // If updating revenue split, validate it adds up to 100
    if (updates.revenue_split) {
      const totalRevenue = Object.values(updates.revenue_split).reduce(
        (sum, val) => sum + val,
        0
      );
      if (Math.abs(totalRevenue - 100) > 0.01) {
        return {
          success: false,
          error: `Revenue split must total 100% (currently ${totalRevenue}%)`,
        };
      }

      // Reset all approvals when revenue split changes
      await supabase
        .from("collaborative_project_approvals")
        .update({
          approved: null,
          approved_at: null,
        })
        .eq("collaborative_project_id", projectId);

      // Update member revenue percentages
      const updatePromises = Object.entries(updates.revenue_split).map(
        ([userId, percentage]) =>
          supabase
            .from("collaborative_project_members")
            .update({ revenue_percentage: percentage })
            .eq("collaborative_project_id", projectId)
            .eq("user_id", userId)
      );

      await Promise.all(updatePromises);
    }

    const { error } = await supabase
      .from("collaborative_projects")
      .update(updates)
      .eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Delete/archive a collaborative project
   */
  static async archiveCollaborativeProject(
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("collaborative_projects")
      .update({ status: "archived" })
      .eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}