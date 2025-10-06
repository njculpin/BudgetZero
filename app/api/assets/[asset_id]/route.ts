import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    asset_id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { asset_id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("creator_id")
      .eq("id", asset_id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      status,
      is_public,
      is_featured,
      license_type,
      license_terms,
      royalty_percentage,
      price_cents,
      seeking_collaborators,
      tags,
    } = body;

    // Update asset
    const { data: updatedAsset, error: updateError } = await supabase
      .from("assets")
      .update({
        title,
        description,
        status,
        is_public,
        is_featured,
        license_type,
        license_terms,
        royalty_percentage,
        price_cents,
        seeking_collaborators,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", asset_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating asset:", updateError);
      return NextResponse.json(
        { error: "Failed to update asset" },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error("Error in PATCH /api/assets/[asset_id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
