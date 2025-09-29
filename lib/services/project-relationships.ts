import { SupabaseClient } from "@supabase/supabase-js";
import {
  ProjectRelationship,
  ProjectRelationshipWithProjects,
  ProjectMergeProposal,
  ProjectMergeProposalWithProjects,
  CreateProjectMergeProposalData,
  ProjectRelationshipType,
  MergeStatus,
  ApiResponse,
} from "@/lib/types/database";

export class ProjectRelationshipService {
  constructor(private supabase: SupabaseClient) {}

  // Create a relationship between projects (fork, merge, component)
  async createRelationship(
    parentProjectId: string,
    childProjectId: string,
    relationshipType: ProjectRelationshipType,
    createdBy: string
  ): Promise<ApiResponse<ProjectRelationship>> {
    try {
      const { data, error } = await this.supabase
        .from("project_relationships")
        .insert([
          {
            parent_project_id: parentProjectId,
            child_project_id: childProjectId,
            relationship_type: relationshipType,
            created_by: createdBy,
          },
        ])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get project relationships with full project details
  async getProjectRelationships(
    projectId: string
  ): Promise<ApiResponse<ProjectRelationshipWithProjects[]>> {
    try {
      const { data, error } = await this.supabase
        .from("project_relationships")
        .select(`
          *,
          parent_project:game_projects!parent_project_id(*),
          child_project:game_projects!child_project_id(*),
          creator:profiles!created_by(*)
        `)
        .or(`parent_project_id.eq.${projectId},child_project_id.eq.${projectId}`);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create a project merge proposal
  async createMergeProposal(
    proposalData: CreateProjectMergeProposalData
  ): Promise<ApiResponse<ProjectMergeProposal>> {
    try {
      // Get all project owners who need to approve
      const projectIds = [
        proposalData.target_project_id,
        ...proposalData.source_project_ids,
      ];

      const { data: projects, error: projectsError } = await this.supabase
        .from("game_projects")
        .select("id, creator_id")
        .in("id", projectIds);

      if (projectsError || !projects) {
        return { data: null, error: "Failed to fetch project owners" };
      }

      const requiresApprovalFrom = projects.map((p) => p.creator_id);

      const { data, error } = await this.supabase
        .from("project_merge_proposals")
        .insert([
          {
            ...proposalData,
            merge_status: "proposed" as MergeStatus,
            requires_approval_from: requiresApprovalFrom,
            approved_by: [],
            declined_by: [],
          },
        ])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Approve or decline a merge proposal
  async respondToMergeProposal(
    proposalId: string,
    userId: string,
    response: "approve" | "decline"
  ): Promise<ApiResponse<ProjectMergeProposal>> {
    try {
      // Get current proposal
      const { data: proposal, error: fetchError } = await this.supabase
        .from("project_merge_proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (fetchError || !proposal) {
        return { data: null, error: "Merge proposal not found" };
      }

      // Check if user is required to approve
      if (!proposal.requires_approval_from.includes(userId)) {
        return { data: null, error: "User not authorized to respond" };
      }

      // Update approval/decline arrays
      let approved_by = proposal.approved_by;
      let declined_by = proposal.declined_by;

      if (response === "approve") {
        approved_by = [...new Set([...approved_by, userId])];
        declined_by = declined_by.filter((id: string) => id !== userId);
      } else {
        declined_by = [...new Set([...declined_by, userId])];
        approved_by = approved_by.filter((id: string) => id !== userId);
      }

      // Determine new status
      let merge_status: MergeStatus = "proposed";
      if (declined_by.length > 0) {
        merge_status = "declined";
      } else if (approved_by.length === proposal.requires_approval_from.length) {
        merge_status = "accepted";
      }

      const { data, error } = await this.supabase
        .from("project_merge_proposals")
        .update({
          approved_by,
          declined_by,
          merge_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Execute an accepted merge proposal (create new collaborative project)
  async executeMerge(
    proposalId: string
  ): Promise<ApiResponse<{ mergedProjectId: string }>> {
    try {
      // Get the accepted proposal with all project details
      const { data: proposal, error: proposalError } = await this.supabase
        .from("project_merge_proposals")
        .select(`
          *,
          target_project:game_projects!target_project_id(*),
          source_projects:game_projects!source_project_ids(*)
        `)
        .eq("id", proposalId)
        .eq("merge_status", "accepted")
        .single();

      if (proposalError || !proposal) {
        return { data: null, error: "Accepted merge proposal not found" };
      }

      // Create new merged project
      const { data: mergedProject, error: createError } = await this.supabase
        .from("game_projects")
        .insert([
          {
            title: proposal.proposed_title,
            description: proposal.proposed_description,
            slug: `${proposal.target_project.slug}-merged-${Date.now()}`,
            creator_id: proposal.proposed_by,
            status: "draft",
            is_public: false,
            tags: [
              ...proposal.target_project.tags,
              ...proposal.source_projects.flatMap((p: any) => p.tags),
            ],
            license_type: "commercial", // Merged projects default to commercial
          },
        ])
        .select()
        .single();

      if (createError || !mergedProject) {
        return { data: null, error: "Failed to create merged project" };
      }

      // Add all original creators as collaborators with revenue splits
      const collaborators = Object.entries(proposal.revenue_split).map(
        ([userId, percentage]) => ({
          project_id: mergedProject.id,
          collaborator_id: userId,
          role: "designer" as const,
          permissions: ["edit", "admin"] as const,
          invitation_status: "accepted" as const,
          invited_by: proposal.proposed_by,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          revenue_percentage: percentage as number,
          contribution_description: "Co-creator through project merge",
          is_active: true,
        })
      );

      await this.supabase
        .from("project_collaborators")
        .insert(collaborators);

      // Mark proposal as completed
      await this.supabase
        .from("project_merge_proposals")
        .update({
          merge_status: "completed" as MergeStatus,
          completed_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      // Create relationships to source projects
      for (const sourceProjectId of proposal.source_project_ids) {
        await this.createRelationship(
          sourceProjectId,
          mergedProject.id,
          "merge",
          proposal.proposed_by
        );
      }

      return { data: { mergedProjectId: mergedProject.id }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get merge proposals for a user (sent or received)
  async getUserMergeProposals(
    userId: string
  ): Promise<ApiResponse<ProjectMergeProposalWithProjects[]>> {
    try {
      const { data, error } = await this.supabase
        .from("project_merge_proposals")
        .select(`
          *,
          target_project:game_projects!target_project_id(*),
          source_projects:game_projects!source_project_ids(*),
          proposer:profiles!proposed_by(*)
        `)
        .or(
          `proposed_by.eq.${userId},requires_approval_from.cs.{${userId}}`
        )
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}