import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    document_id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { document_id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("creator_id, project_id, projects(creator_id)")
      .eq("id", document_id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const isOwner = document.creator_id === user.id;
    const isProjectOwner =
      document.projects && document.projects.creator_id === user.id;

    if (!isOwner && !isProjectOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      document_type,
      status,
      is_public,
      license_type,
      license_terms,
      royalty_percentage,
      seeking_collaborators,
      tags,
    } = body;

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from("documents")
      .update({
        title,
        description,
        document_type,
        status,
        is_public,
        license_type,
        license_terms,
        royalty_percentage,
        seeking_collaborators,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating document:", updateError);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error in PATCH /api/documents/[document_id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
