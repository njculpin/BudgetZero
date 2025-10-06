"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GameProjectService } from "@/lib/services/game-projects";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/types/database";

export async function deleteProject(projectId: string, projectSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const gameProjectService = new GameProjectService(supabase);

  // Delete the project
  const result = await gameProjectService.deleteProject(projectId, user.id);

  if (result.error) {
    throw new Error(result.error);
  }

  // Revalidate the projects list
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectSlug}`);

  // Redirect to projects page
  redirect("/projects");
}

export async function updateProject(
  projectId: string,
  projectSlug: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const gameProjectService = new GameProjectService(supabase);

  // Extract form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const genre = formData.get("genre") as string;
  const complexity = formData.get("complexity") as string;
  const isPublic = formData.get("is_public") === "on";
  const seekingCollaborators = formData.get("seeking_collaborators") === "on";

  // Update the project
  const result = await gameProjectService.updateProject(projectId, user.id, {
    title,
    description,
    status: status as ProjectStatus,
    genre: genre || undefined,
    complexity_rating: complexity ? parseInt(complexity, 10) : undefined,
    is_public: isPublic,
    seeking_collaborators: seekingCollaborators,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  // Revalidate the project pages
  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}/settings`);
  revalidatePath("/projects");

  return { success: true };
}

export async function archiveProject(projectId: string, projectSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const gameProjectService = new GameProjectService(supabase);

  // Update project status to archived
  const result = await gameProjectService.updateProject(projectId, user.id, {
    status: "archived",
  });

  if (result.error) {
    throw new Error(result.error);
  }

  // Revalidate the project pages
  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}/settings`);
  revalidatePath("/projects");

  return { success: true };
}
