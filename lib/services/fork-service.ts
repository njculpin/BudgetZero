import { createClient } from "@/lib/supabase/server";
import type {
  ProjectFork,
  ProjectForkWithProjects,
  CreateProjectForkData,
  ForkStatus,
} from "@/lib/types/database";

export class ForkService {
  /**
   * Create a fork request from one project to another
   */
  static async createForkRequest(
    data: CreateProjectForkData
  ): Promise<{ success: boolean; data?: ProjectFork; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify user owns the parent project
    const { data: parentProject } = await supabase
      .from("game_projects")
      .select("creator_id")
      .eq("id", data.parent_project_id)
      .single();

    if (!parentProject || parentProject.creator_id !== user.id) {
      return {
        success: false,
        error: "You must own the parent project to create a fork request",
      };
    }

    // Check if fork request already exists
    const { data: existing } = await supabase
      .from("project_forks")
      .select("id, status")
      .eq("parent_project_id", data.parent_project_id)
      .eq("child_project_id", data.child_project_id)
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        return { success: false, error: "Fork request already pending" };
      }
      // If rejected or expired, allow creating a new request
      await supabase.from("project_forks").delete().eq("id", existing.id);
    }

    const { data: fork, error } = await supabase
      .from("project_forks")
      .insert({
        parent_project_id: data.parent_project_id,
        child_project_id: data.child_project_id,
        fork_type: data.fork_type,
        message: data.message,
        requested_by: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: fork };
  }

  /**
   * Respond to a fork request (accept or reject)
   */
  static async respondToForkRequest(
    forkId: string,
    status: "accepted" | "rejected"
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get fork details
    const { data: fork } = await supabase
      .from("project_forks")
      .select("*, child_project:game_projects!project_forks_child_project_id_fkey(creator_id)")
      .eq("id", forkId)
      .single();

    if (!fork) {
      return { success: false, error: "Fork request not found" };
    }

    // Verify user owns the child project
    if (fork.child_project.creator_id !== user.id) {
      return {
        success: false,
        error: "You must own the child project to respond to this request",
      };
    }

    const { error } = await supabase
      .from("project_forks")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", forkId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get all fork requests for a user's projects
   */
  static async getUserForkRequests(): Promise<{
    success: boolean;
    incoming?: ProjectForkWithProjects[];
    outgoing?: ProjectForkWithProjects[];
    error?: string;
  }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get incoming fork requests (where user owns the child project)
    const { data: incomingData, error: incomingError } = await supabase
      .from("project_forks")
      .select(
        `
        *,
        parent_project:game_projects!project_forks_parent_project_id_fkey(*),
        child_project:game_projects!project_forks_child_project_id_fkey(*),
        requester:profiles!project_forks_requested_by_fkey(*)
      `
      )
      .eq("child_project.creator_id", user.id)
      .order("requested_at", { ascending: false });

    if (incomingError) {
      return { success: false, error: incomingError.message };
    }

    // Get outgoing fork requests (where user created the request)
    const { data: outgoingData, error: outgoingError } = await supabase
      .from("project_forks")
      .select(
        `
        *,
        parent_project:game_projects!project_forks_parent_project_id_fkey(*),
        child_project:game_projects!project_forks_child_project_id_fkey(*),
        requester:profiles!project_forks_requested_by_fkey(*)
      `
      )
      .eq("requested_by", user.id)
      .order("requested_at", { ascending: false });

    if (outgoingError) {
      return { success: false, error: outgoingError.message };
    }

    return {
      success: true,
      incoming: incomingData as ProjectForkWithProjects[],
      outgoing: outgoingData as ProjectForkWithProjects[],
    };
  }

  /**
   * Get fork requests for a specific project
   */
  static async getProjectForkRequests(
    projectId: string
  ): Promise<{ success: boolean; data?: ProjectForkWithProjects[]; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_forks")
      .select(
        `
        *,
        parent_project:game_projects!project_forks_parent_project_id_fkey(*),
        child_project:game_projects!project_forks_child_project_id_fkey(*),
        requester:profiles!project_forks_requested_by_fkey(*)
      `
      )
      .or(`parent_project_id.eq.${projectId},child_project_id.eq.${projectId}`)
      .order("requested_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ProjectForkWithProjects[] };
  }

  /**
   * Delete a pending fork request
   */
  static async deleteForkRequest(
    forkId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("project_forks")
      .delete()
      .eq("id", forkId)
      .eq("requested_by", user.id)
      .eq("status", "pending");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get pending fork requests count for a user
   */
  static async getPendingForkRequestsCount(): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { count, error } = await supabase
      .from("project_forks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .or(
        `child_project_id.in.(select id from game_projects where creator_id = '${user.id}')`
      );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  }
}