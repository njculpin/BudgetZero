import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/project-document-references - Get document references for a project or user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");

    let query = supabase
      .from("project_document_references")
      .select(
        `
        id,
        royalty_percentage,
        status,
        requested_at,
        requested_by,
        document_id,
        project_id,
        documents!project_document_references_document_id_fkey(id, title, document_type, creator_id),
        projects!project_document_references_project_id_fkey(id, title, slug, creator_id)
      `,
      )
      .order("requested_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: references, error } = await query;

    if (error) {
      console.error("Error fetching document references:", error);
      return NextResponse.json(
        { error: "Failed to fetch references" },
        { status: 500 },
      );
    }

    return NextResponse.json({ references });
  } catch (error) {
    console.error("Error in GET /api/project-document-references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/project-document-references - Approve or reject a document reference
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reference_id, status } = body;

    if (!reference_id || !status) {
      return NextResponse.json(
        { error: "Missing reference_id or status" },
        { status: 400 },
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 },
      );
    }

    // Get the reference with document info
    const { data: reference, error: refError } = await supabase
      .from("project_document_references")
      .select(
        `
        id,
        royalty_percentage,
        status,
        project_id,
        document_id,
        requested_by,
        documents!project_document_references_document_id_fkey(id, title, creator_id)
      `,
      )
      .eq("id", reference_id)
      .single();

    if (refError || !reference) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 },
      );
    }

    // Verify user owns the document
    const document = Array.isArray(reference.documents)
      ? reference.documents[0]
      : reference.documents;

    if (document.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You do not own this document" },
        { status: 403 },
      );
    }

    // Update reference status
    const { error: updateError } = await supabase
      .from("project_document_references")
      .update({ status })
      .eq("id", reference_id);

    if (updateError) {
      throw updateError;
    }

    // If approved, create collaborator
    if (status === "approved") {
      const { data: documentCreator } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", document.creator_id)
        .single();

      // Check for existing collaborator
      const { data: existingCollab } = await supabase
        .from("project_collaborators")
        .select("id, revenue_percentage")
        .eq("project_id", reference.project_id)
        .eq("collaborator_id", document.creator_id)
        .single();

      if (!existingCollab) {
        await supabase.from("project_collaborators").insert({
          project_id: reference.project_id,
          collaborator_id: document.creator_id,
          role: documentCreator?.role || "editor",
          permissions: ["read"],
          invitation_status: "accepted",
          joined_at: new Date().toISOString(),
          revenue_percentage: reference.royalty_percentage,
          contribution_description: `Contributed document (reference ${reference_id})`,
          is_active: true,
        });
      } else {
        // Update existing collaborator revenue percentage
        await supabase
          .from("project_collaborators")
          .update({
            revenue_percentage:
              (existingCollab.revenue_percentage || 0) +
              reference.royalty_percentage,
          })
          .eq("id", existingCollab.id);
      }
    }

    // Create notification
    const notificationTitle =
      status === "approved"
        ? "Document reference approved"
        : "Document reference rejected";

    const notificationMessage =
      status === "approved"
        ? `Your document "${document.title}" has been approved for use in a project`
        : `Your document reference request was rejected`;

    await supabase.from("notifications").insert({
      user_id: reference.requested_by,
      type:
        status === "approved"
          ? "asset_reference_approved"
          : "asset_reference_rejected",
      title: notificationTitle,
      message: notificationMessage,
      link_url: `/collaboration/requests`,
      metadata: {
        reference_id,
        reference_type: "document",
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reference ${status}`,
    });
  } catch (error) {
    console.error("Error in PATCH /api/project-document-references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
