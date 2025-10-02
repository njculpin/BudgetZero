import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      title,
      description,
      document_type,
      royalty_percentage,
      is_public,
      seeking_collaborators,
    } = body;

    if (!project_id || !title) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, title" },
        { status: 400 },
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You don't own this project" },
        { status: 403 },
      );
    }

    // Create document
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert([
        {
          creator_id: user.id,
          project_id,
          title,
          description: description || null,
          document_type: document_type || "rulebook",
          royalty_percentage: royalty_percentage || 0,
          is_public: is_public || false,
          seeking_collaborators: seeking_collaborators || false,
          status: "draft",
          content: { type: "doc", content: [] },
        },
      ])
      .select()
      .single();

    if (documentError) {
      console.error("Error creating document:", documentError);
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error in POST /api/documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    let query = supabase
      .from("documents")
      .select("*, creator:creator_id(id, full_name, username, avatar_url)");

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data: documents, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 },
      );
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error in GET /api/documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
