import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await params;
    const { assetId } = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("creator_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify user owns the asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("creator_id")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only add your own assets to projects" },
        { status: 403 },
      );
    }

    // Check if asset is already in project
    const { data: existingLink } = await supabase
      .from("project_assets")
      .select("id")
      .eq("project_id", projectId)
      .eq("asset_id", assetId)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json(
        { error: "Asset already added to project" },
        { status: 400 },
      );
    }

    // Add asset to project
    const { error: insertError } = await supabase
      .from("project_assets")
      .insert({
        project_id: projectId,
        asset_id: assetId,
      });

    if (insertError) {
      console.error("Error adding asset to project:", insertError);
      return NextResponse.json(
        { error: "Failed to add asset to project" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/projects/[id]/assets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
