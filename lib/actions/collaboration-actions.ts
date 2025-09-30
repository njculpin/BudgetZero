"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProjectRelationshipService } from "@/lib/services/project-relationships";
import { GameProjectService } from "@/lib/services/game-projects";
import {
  CreateCollaboratorInviteData,
  CreateProjectMergeProposalData,
} from "@/lib/types/database";
import {
  sendCollaborationInviteEmail,
  sendInviteResponseEmail,
  sendMergeProposalEmail,
  sendMergeCompletionEmail,
} from "@/lib/services/email";

export async function inviteCollaborator(
  projectId: string,
  collaboratorEmail: string,
  role: string,
  permissions: string[],
  contributionDescription?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Find collaborator by email
    const { data: collaborator, error: collaboratorError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", collaboratorEmail)
      .single();

    if (collaboratorError || !collaborator) {
      return { error: "User not found with that email address" };
    }

    // Check if user is project owner or has admin permissions
    const gameProjectService = new GameProjectService(supabase);
    const projectResult = await gameProjectService.getProjectById(projectId);

    if (projectResult.error || !projectResult.data) {
      return { error: "Project not found" };
    }

    const isOwner = projectResult.data.creator_id === user.id;
    if (!isOwner) {
      // Check if user has admin permissions
      const { data: existingCollaborator } = await supabase
        .from("project_collaborators")
        .select("permissions")
        .eq("project_id", projectId)
        .eq("collaborator_id", user.id)
        .eq("is_active", true)
        .single();

      if (!existingCollaborator || !existingCollaborator.permissions.includes("admin")) {
        return { error: "Only project owners and admins can invite collaborators" };
      }
    }

    // Check if collaborator is already invited or part of the project
    const { data: existingInvite } = await supabase
      .from("project_collaborators")
      .select("id, invitation_status")
      .eq("project_id", projectId)
      .eq("collaborator_id", collaborator.id)
      .single();

    if (existingInvite) {
      if (existingInvite.invitation_status === "pending") {
        return { error: "Invitation already sent to this user" };
      } else if (existingInvite.invitation_status === "accepted") {
        return { error: "User is already a collaborator on this project" };
      }
    }

    // Create invitation
    const { data, error } = await supabase
      .from("project_collaborators")
      .insert([
        {
          project_id: projectId,
          collaborator_id: collaborator.id,
          role: role as any,
          permissions: permissions as any,
          invitation_status: "pending",
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          revenue_percentage: 0, // Will be negotiated later
          contribution_description: contributionDescription,
          is_active: false, // Becomes true when accepted
        },
      ])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Get inviter and collaborator details for email
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const { data: collaboratorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", collaborator.id)
      .single();

    // Send email notification to invited user
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`;
    await sendCollaborationInviteEmail(collaboratorEmail, {
      inviteeName: collaboratorProfile?.full_name || collaboratorEmail,
      inviterName: inviterProfile?.full_name || inviterProfile?.email || "A collaborator",
      projectTitle: projectResult.data.title,
      projectSlug: projectResult.data.slug,
      role,
      dashboardUrl,
    });

    revalidatePath(`/projects/${projectResult.data.slug}`);
    return { success: true, data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to invite collaborator",
    };
  }
}

export async function respondToCollaborationInvite(
  inviteId: string,
  response: "accept" | "decline"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Get invitation details
    const { data: invite, error: inviteError } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        project:game_projects(*),
        inviter:profiles!invited_by(*)
      `)
      .eq("id", inviteId)
      .eq("collaborator_id", user.id)
      .eq("invitation_status", "pending")
      .single();

    if (inviteError || !invite) {
      return { error: "Invitation not found or already responded to" };
    }

    const updateData = {
      invitation_status: response === "accept" ? "accepted" : "declined",
      joined_at: response === "accept" ? new Date().toISOString() : null,
      is_active: response === "accept",
    };

    const { error } = await supabase
      .from("project_collaborators")
      .update(updateData)
      .eq("id", inviteId);

    if (error) {
      return { error: error.message };
    }

    // Get collaborator profile for email
    const { data: collaboratorProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Send email notification to project owner
    const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/projects/${invite.project.slug}`;
    await sendInviteResponseEmail(invite.inviter.email, {
      ownerName: invite.inviter.full_name || invite.inviter.email,
      collaboratorName: collaboratorProfile?.full_name || collaboratorProfile?.email || "A user",
      projectTitle: invite.project.title,
      projectSlug: invite.project.slug,
      accepted: response === "accept",
      projectUrl,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${invite.project.slug}`);

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to respond to invitation",
    };
  }
}

export async function proposeProjectMerge(
  targetProjectId: string,
  sourceProjectIds: string[],
  proposedTitle: string,
  proposedDescription?: string,
  mergeTerms?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    const relationshipService = new ProjectRelationshipService(supabase);

    // Calculate equal revenue split by default
    const allProjectIds = [targetProjectId, ...sourceProjectIds];
    const equalSplit = 100 / allProjectIds.length;

    // Get all project owners
    const { data: projects, error: projectsError } = await supabase
      .from("game_projects")
      .select("id, creator_id")
      .in("id", allProjectIds);

    if (projectsError || !projects) {
      return { error: "Failed to fetch project details" };
    }

    // Create revenue split object
    const revenueSplit: Record<string, number> = {};
    projects.forEach((project) => {
      revenueSplit[project.creator_id] = equalSplit;
    });

    const proposalData: CreateProjectMergeProposalData = {
      target_project_id: targetProjectId,
      source_project_ids: sourceProjectIds,
      proposed_by: user.id,
      proposed_title: proposedTitle,
      proposed_description: proposedDescription,
      revenue_split: revenueSplit,
      merge_terms: mergeTerms,
    };

    const result = await relationshipService.createMergeProposal(proposalData);

    if (result.error) {
      return { error: result.error };
    }

    // Get proposer profile
    const { data: proposerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Send notifications to all project owners who need to approve
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`;

    for (const project of projects) {
      if (project.creator_id !== user.id) {
        // Get project owner's profile and email
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", project.creator_id)
          .single();

        if (ownerProfile?.email) {
          await sendMergeProposalEmail(ownerProfile.email, {
            recipientName: ownerProfile.full_name || ownerProfile.email,
            proposerName: proposerProfile?.full_name || proposerProfile?.email || "A creator",
            proposedTitle,
            proposedDescription,
            projectCount: allProjectIds.length,
            revenueSplit: equalSplit,
            dashboardUrl,
          });
        }
      }
    }

    revalidatePath("/dashboard");
    return { success: true, data: result.data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create merge proposal",
    };
  }
}

export async function respondToMergeProposal(
  proposalId: string,
  response: "approve" | "decline"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    const relationshipService = new ProjectRelationshipService(supabase);
    const result = await relationshipService.respondToMergeProposal(
      proposalId,
      user.id,
      response
    );

    if (result.error) {
      return { error: result.error };
    }

    // If all parties have approved, automatically execute the merge
    if (result.data?.merge_status === "accepted") {
      const executeResult = await relationshipService.executeMerge(proposalId);
      if (executeResult.error) {
        return { error: executeResult.error };
      }

      // Get merged project details and send notifications to all co-owners
      const { data: mergedProject } = await supabase
        .from("game_projects")
        .select("slug, title")
        .eq("id", executeResult.data?.mergedProjectId)
        .single();

      if (mergedProject) {
        // Get all collaborators (co-owners) of the merged project
        const { data: collaborators } = await supabase
          .from("project_collaborators")
          .select(`
            collaborator_id,
            collaborator:profiles!collaborator_id(full_name, email)
          `)
          .eq("project_id", executeResult.data?.mergedProjectId);

        if (collaborators) {
          const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/projects/${mergedProject.slug}`;
          const coOwnerNames = collaborators
            .map((c: any) => c.collaborator?.full_name || c.collaborator?.email)
            .filter(Boolean);

          // Send notification to all co-owners
          for (const collab of collaborators) {
            const collaboratorData = collab.collaborator as any;
            if (collaboratorData?.email) {
              await sendMergeCompletionEmail(collaboratorData.email, {
                recipientName: collaboratorData.full_name || collaboratorData.email,
                mergedProjectTitle: mergedProject.title,
                mergedProjectSlug: mergedProject.slug,
                coOwners: coOwnerNames,
                projectUrl,
              });
            }
          }
        }

        redirect(`/projects/${mergedProject.slug}`);
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to respond to merge proposal",
    };
  }
}

export async function getUserCollaborationInvites() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        project:game_projects(*),
        inviter:profiles!invited_by(*)
      `)
      .eq("collaborator_id", user.id)
      .eq("invitation_status", "pending")
      .order("invited_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch invitations",
    };
  }
}

export async function getUserMergeProposals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: null };
  }

  try {
    const relationshipService = new ProjectRelationshipService(supabase);
    const result = await relationshipService.getUserMergeProposals(user.id);

    return result;
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch merge proposals",
    };
  }
}