import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { asset_id, project_id, message } = body;

    if (!asset_id || !message) {
      return NextResponse.json(
        { error: "Asset ID and message are required" },
        { status: 400 },
      );
    }

    // Validate message length
    if (message.length < 20 || message.length > 1000) {
      return NextResponse.json(
        { error: "Message must be between 20 and 1000 characters" },
        { status: 400 },
      );
    }

    // Get asset details and verify it exists and is seeking collaborators
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select(
        `
        id,
        title,
        creator_id,
        seeking_collaborators,
        asset_type,
        creator:profiles!assets_creator_id_fkey (
          id,
          full_name,
          username,
          email
        )
      `,
      )
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Check if asset is seeking collaborators
    if (!asset.seeking_collaborators) {
      return NextResponse.json(
        { error: "This asset is not seeking collaborators" },
        { status: 400 },
      );
    }

    // Don't allow users to propose to themselves
    if (asset.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot propose collaboration on your own asset" },
        { status: 400 },
      );
    }

    // Check if proposal already exists
    const { data: existingProposal } = await supabase
      .from("collaboration_proposals")
      .select("id")
      .eq("asset_id", asset_id)
      .eq("proposer_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingProposal) {
      return NextResponse.json(
        { error: "You already have a pending proposal for this asset" },
        { status: 400 },
      );
    }

    // Create collaboration proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("collaboration_proposals")
      .insert({
        asset_id,
        project_id: project_id || null,
        proposer_id: user.id,
        recipient_id: asset.creator_id,
        message,
        status: "pending",
      })
      .select()
      .single();

    if (proposalError) {
      console.error("Proposal creation error:", proposalError);
      return NextResponse.json(
        { error: "Failed to create proposal" },
        { status: 500 },
      );
    }

    // TODO: Send notification to asset creator
    // This would integrate with your notification system

    return NextResponse.json({
      success: true,
      proposal_id: proposal.id,
      message: "Collaboration proposal sent successfully",
    });
  } catch (error) {
    console.error("Collaboration proposal error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
