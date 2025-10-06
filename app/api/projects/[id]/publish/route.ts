import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/projects/[id]/publish - Publish a project to marketplace
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify user is project owner or collaborator
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, creator_id, status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.creator_id === user.id;

    const { data: isCollaborator } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("collaborator_id", user.id)
      .eq("is_active", true)
      .single();

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: "You do not have permission to publish this project" },
        { status: 403 },
      );
    }

    // Check if project can be published using database function
    const { data: canPublish, error: checkError } = await supabase.rpc(
      "can_publish_project",
      {
        p_project_id: projectId,
      },
    );

    if (checkError) {
      console.error("Error checking publish eligibility:", checkError);
      return NextResponse.json(
        { error: "Failed to check publish requirements" },
        { status: 500 },
      );
    }

    if (!canPublish) {
      // Get detailed validation errors
      const validationErrors: string[] = [];

      // Check pricing tiers
      const { data: pricingTiers } = await supabase
        .from("pricing_tiers")
        .select("id")
        .eq("project_id", projectId);

      if (!pricingTiers || pricingTiers.length === 0) {
        validationErrors.push("Project must have at least one pricing tier");
      }

      // Check content
      const { data: assets } = await supabase
        .from("project_assets")
        .select("id")
        .eq("project_id", projectId);

      const { data: documents } = await supabase
        .from("documents")
        .select("id")
        .eq("project_id", projectId);

      if (
        (!assets || assets.length === 0) &&
        (!documents || documents.length === 0)
      ) {
        validationErrors.push(
          "Project must have at least one asset or document",
        );
      }

      // Check approvals
      const { data: projectSettings } = await supabase
        .from("projects")
        .select("requires_all_owner_approval")
        .eq("id", projectId)
        .single();

      if (projectSettings?.requires_all_owner_approval) {
        const { data: approvals } = await supabase
          .from("project_publication_approvals")
          .select("approved")
          .eq("project_id", projectId);

        const allApproved = approvals?.every((a) => a.approved);
        if (!allApproved) {
          validationErrors.push("All co-owners must approve publication");
        }
      }

      return NextResponse.json(
        {
          error: "Project cannot be published",
          validation_errors: validationErrors,
        },
        { status: 400 },
      );
    }

    // Publish the project using database function
    const { error: publishError } = await supabase.rpc("publish_project", {
      p_project_id: projectId,
    });

    if (publishError) {
      console.error("Error publishing project:", publishError);
      return NextResponse.json(
        { error: "Failed to publish project" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Project published successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/projects/[id]/publish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/projects/[id]/publish - Check if project can be published
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if project can be published
    const { data: canPublish } = await supabase.rpc("can_publish_project", {
      p_project_id: projectId,
    });

    // Get validation details
    const { data: pricingTiers } = await supabase
      .from("pricing_tiers")
      .select("id")
      .eq("project_id", projectId);

    const { data: assets } = await supabase
      .from("project_assets")
      .select("id")
      .eq("project_id", projectId);

    const { data: documents } = await supabase
      .from("documents")
      .select("id")
      .eq("project_id", projectId);

    const { data: approvals } = await supabase
      .from("project_publication_approvals")
      .select("approved, collaborator_id, profiles(full_name)")
      .eq("project_id", projectId);

    return NextResponse.json({
      can_publish: canPublish,
      validation: {
        has_pricing: (pricingTiers?.length || 0) > 0,
        has_content: (assets?.length || 0) > 0 || (documents?.length || 0) > 0,
        approvals: approvals || [],
      },
    });
  } catch (error) {
    console.error("Error in GET /api/projects/[id]/publish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
