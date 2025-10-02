import { NextResponse } from "next/server";
import { z } from "zod";
import { REVENUE_CONSTANTS } from "@/lib/constants/revenue";
import { createClient } from "@/lib/supabase/server";

const createReferenceSchema = z.object({
  project_id: z.string().uuid("Invalid project ID format"),
  asset_id: z.string().uuid("Invalid asset ID format"),
  royalty_percentage: z
    .number()
    .min(
      REVENUE_CONSTANTS.MIN_ROYALTY_PERCENTAGE,
      `Royalty must be at least ${REVENUE_CONSTANTS.MIN_ROYALTY_PERCENTAGE}%`,
    )
    .max(
      REVENUE_CONSTANTS.MAX_ROYALTY_PERCENTAGE,
      `Royalty cannot exceed ${REVENUE_CONSTANTS.MAX_ROYALTY_PERCENTAGE}%`,
    ),
});

const updateReferenceSchema = z.object({
  reference_id: z.string().uuid("Invalid reference ID format"),
  status: z.enum(["approved", "rejected"], {
    message: "Status must be either 'approved' or 'rejected'",
  }),
});

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

    // Validate input
    const validation = createReferenceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { project_id, asset_id, royalty_percentage } = validation.data;

    // Verify the user owns the project
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

    // Verify the asset exists and get its owner
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, creator_id, royalty_percentage")
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Check if reference already exists
    const { data: existingRef } = await supabase
      .from("project_asset_references")
      .select("id, status")
      .eq("project_id", project_id)
      .eq("asset_id", asset_id)
      .single();

    if (existingRef) {
      return NextResponse.json(
        {
          error: `Reference already exists with status: ${existingRef.status}`,
          reference: existingRef,
        },
        { status: 409 },
      );
    }

    // Create the reference request
    const { data: reference, error: referenceError } = await supabase
      .from("project_asset_references")
      .insert([
        {
          project_id,
          asset_id,
          royalty_percentage: asset.royalty_percentage, // Use asset's royalty percentage
          status: "pending",
          requested_by: user.id,
          requested_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (referenceError) {
      console.error("Error creating reference:", referenceError);
      return NextResponse.json(
        { error: "Failed to create reference request" },
        { status: 500 },
      );
    }

    // TODO: Send notification to asset owner (Phase 1)
    // await sendNotification({
    //   to: asset.creator_id,
    //   type: 'asset_reference_request',
    //   data: { project_id, asset_id, reference_id: reference.id }
    // });

    return NextResponse.json({
      success: true,
      reference,
      message: "Reference request sent to asset owner",
    });
  } catch (error) {
    console.error("Error in POST /api/project-asset-references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    // Validate input
    const validation = updateReferenceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { reference_id, status } = validation.data;

    // Get the reference with asset info
    const { data: reference, error: refError } = await supabase
      .from("project_asset_references")
      .select(`
        *,
        asset:assets(creator_id)
      `)
      .eq("id", reference_id)
      .single();

    if (refError || !reference) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 },
      );
    }

    // Verify the user owns the asset
    if (reference.asset.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You don't own this asset" },
        { status: 403 },
      );
    }

    // Update the reference status
    const { data: updatedReference, error: updateError } = await supabase
      .from("project_asset_references")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", reference_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating reference:", updateError);
      return NextResponse.json(
        { error: "Failed to update reference" },
        { status: 500 },
      );
    }

    // TODO: Send notification to project owner (Phase 1)

    return NextResponse.json({
      success: true,
      reference: updatedReference,
      message: `Reference ${status}`,
    });
  } catch (error) {
    console.error("Error in PATCH /api/project-asset-references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const assetId = searchParams.get("asset_id");
    const status = searchParams.get("status");

    let query = supabase.from("project_asset_references").select(`
        *,
        project:projects(id, title, slug),
        asset:assets(id, title, asset_type, thumbnail_url, creator_id)
      `);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (assetId) {
      query = query.eq("asset_id", assetId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: references, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching references:", error);
      return NextResponse.json(
        { error: "Failed to fetch references" },
        { status: 500 },
      );
    }

    return NextResponse.json({ references });
  } catch (error) {
    console.error("Error in GET /api/project-asset-references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
