import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

// Helper to create URL-safe slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, tags = [], team_id } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate unique slug
    const slug = createSlug(title);
    let slugSuffix = 0;
    let finalSlug = slug;

    // Check for slug uniqueness
    while (true) {
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", finalSlug)
        .single();

      if (!existing) break;

      slugSuffix++;
      finalSlug = `${slug}-${slugSuffix}`;
    }

    // Create project (settings and stats are created automatically by trigger)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        creator_id: user.id,
        title,
        description: description || null,
        slug: finalSlug,
        status: "draft",
        team_id: team_id || null,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project creation error:", projectError);
      return NextResponse.json(
        { error: `Failed to create project: ${projectError.message}` },
        { status: 500 },
      );
    }

    // Add tags if provided
    if (tags.length > 0) {
      const tagRecords = tags.map((tag: string) => ({
        project_id: project.id,
        tag: tag.toLowerCase().trim(),
      }));

      const { error: tagsError } = await supabase
        .from("project_tags")
        .insert(tagRecords);

      if (tagsError) {
        console.error("Project tags creation error:", tagsError);
        // Non-fatal - project is created
      }
    }

    return NextResponse.json({
      ...project,
      slug: finalSlug,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
