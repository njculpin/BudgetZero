import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const tagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)).max(20),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validation = tagsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid tags data", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { tags } = validation.data;

    // Update tags
    const { data, error } = await supabase
      .from("projects")
      .update({ tags })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tags:", error);
      return NextResponse.json(
        { error: "Failed to update tags" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tags: data.tags });
  } catch (error) {
    console.error("Error in tags PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
