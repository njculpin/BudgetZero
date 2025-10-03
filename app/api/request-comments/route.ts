import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createCommentSchema = z.object({
  reference_id: z.string().uuid("Invalid reference ID format"),
  comment_text: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
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
    const validation = createCommentSchema.safeParse(body);
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

    const { reference_id, comment_text } = validation.data;

    // Verify user is involved in this request (requester or asset owner)
    const { data: reference, error: refError } = await supabase
      .from("project_asset_references")
      .select(`
        id,
        requested_by,
        asset_id
      `)
      .eq("id", reference_id)
      .single();

    if (refError || !reference) {
      return NextResponse.json(
        { error: "Reference not found" },
        { status: 404 },
      );
    }

    // Get asset creator
    const { data: asset } = await supabase
      .from("assets")
      .select("creator_id")
      .eq("id", reference.asset_id)
      .single();

    const isRequester = reference.requested_by === user.id;
    const isAssetOwner = asset?.creator_id === user.id;

    if (!isRequester && !isAssetOwner) {
      return NextResponse.json(
        { error: "You cannot comment on this request" },
        { status: 403 },
      );
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from("request_comments")
      .insert({
        reference_id,
        user_id: user.id,
        comment_text,
      })
      .select(
        `
        id,
        comment_text,
        created_at,
        updated_at,
        user:profiles!user_id(id, full_name, email, avatar_url)
      `,
      )
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 },
      );
    }

    // Create notification for the other party
    const notifyUserId = isRequester
      ? asset?.creator_id
      : reference.requested_by;

    if (!notifyUserId) {
      return NextResponse.json({ success: true, comment });
    }

    await supabase.from("notifications").insert({
      user_id: notifyUserId,
      type: "asset_reference_request",
      title: "New message on collaboration request",
      message: comment_text.substring(0, 100) + (comment_text.length > 100 ? "..." : ""),
      link_url: `/collaboration/requests`,
      metadata: {
        reference_id,
        comment_id: comment.id,
        commenter_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Error in POST /api/request-comments:", error);
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
    const referenceId = searchParams.get("reference_id");

    if (!referenceId) {
      return NextResponse.json(
        { error: "reference_id is required" },
        { status: 400 },
      );
    }

    // Fetch comments with user info
    const { data: comments, error } = await supabase
      .from("request_comments")
      .select(
        `
        id,
        comment_text,
        created_at,
        updated_at,
        user:profiles!user_id(id, full_name, email, avatar_url)
      `,
      )
      .eq("reference_id", referenceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 },
      );
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error in GET /api/request-comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
