import { createClient } from "@/lib/supabase/server";

export async function useAdminUpdateProjectTags(params: {
  projectId: string;
  tags: string[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Unauthorized") };
  }

  const { projectId, tags } = params;

  if (!Array.isArray(tags)) {
    return { data: null, error: new Error("Tags must be an array") };
  }

  // Verify ownership
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) {
    return { data: null, error: fetchError || new Error("Project not found") };
  }

  if (project.creator_id !== user.id) {
    return { data: null, error: new Error("Forbidden") };
  }

  // Delete existing tags
  const { error: deleteError } = await supabase
    .from("project_tags")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // Insert new tags if any
  if (tags.length > 0) {
    const tagRecords = tags.map((tag: string) => ({
      project_id: projectId,
      tag: tag.toLowerCase().trim(),
    }));

    const { error: insertError } = await supabase
      .from("project_tags")
      .insert(tagRecords);

    if (insertError) {
      return { data: null, error: insertError };
    }
  }

  return { data: { success: true }, error: null };
}
