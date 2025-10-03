import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: project_id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("creator_id")
      .eq("id", project_id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { title, slug, description, status, genre, complexity_rating } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (genre !== undefined) updateData.genre = genre;
    if (complexity_rating !== undefined)
      updateData.complexity_rating = complexity_rating;

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", project_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating project:", updateError);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error in PATCH /api/projects/[project_id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
