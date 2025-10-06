import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createReviewSchema = z.object({
  project_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  review_text: z.string().min(50).max(5000),
  playtime_hours: z.number().positive(),
  playtest_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const voteSchema = z.object({
  review_id: z.string().uuid(),
  vote_type: z.enum(["upvote", "downvote"]),
});

// POST /api/playtest-reviews - Create a playtest review
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
    const validation = createReviewSchema.safeParse(body);
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

    const { project_id, rating, review_text, playtime_hours, playtest_date } =
      validation.data;

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create review (VP is awarded automatically via trigger)
    const { data: review, error: reviewError } = await supabase
      .from("playtest_reviews")
      .insert({
        project_id,
        reviewer_id: user.id,
        rating,
        review_text,
        playtime_hours,
        playtest_date,
      })
      .select(
        `
        id,
        rating,
        review_text,
        playtime_hours,
        playtest_date,
        upvotes,
        downvotes,
        vp_earned,
        created_at,
        profiles!playtest_reviews_reviewer_id_fkey(id, full_name, email, avatar_url)
      `,
      )
      .single();

    if (reviewError) {
      console.error("Error creating review:", reviewError);
      if (reviewError.code === "23505") {
        return NextResponse.json(
          { error: "You've already reviewed this project on this date" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Failed to create review" },
        { status: 500 },
      );
    }

    // Create notification for project owner
    const { data: projectOwner } = await supabase
      .from("projects")
      .select("creator_id")
      .eq("id", project_id)
      .single();

    if (projectOwner && projectOwner.creator_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: projectOwner.creator_id,
        type: "asset_reference_request",
        title: "New playtest review",
        message: `${review_text.substring(0, 100)}...`,
        link_url: `/projects/${project_id}`,
        metadata: {
          review_id: review.id,
          reviewer_id: user.id,
          rating,
        },
      });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error in POST /api/playtest-reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/playtest-reviews - Get reviews for a project
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 },
      );
    }

    // Fetch reviews
    const { data: reviews, error } = await supabase
      .from("playtest_reviews")
      .select(
        `
        id,
        rating,
        review_text,
        playtime_hours,
        playtest_date,
        upvotes,
        downvotes,
        vp_earned,
        is_verified,
        created_at,
        profiles!playtest_reviews_reviewer_id_fkey(id, full_name, email, avatar_url)
      `,
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error in GET /api/playtest-reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/playtest-reviews - Vote on a review
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
    const validation = voteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { review_id, vote_type } = validation.data;

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("review_votes")
      .select("id, vote_type")
      .eq("review_id", review_id)
      .eq("voter_id", user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote if clicking same button
        const { error: deleteError } = await supabase
          .from("review_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw deleteError;
        }

        return NextResponse.json({
          success: true,
          action: "removed",
          vote_type,
        });
      }
      // Update vote if changing
      const { error: updateError } = await supabase
        .from("review_votes")
        .update({ vote_type })
        .eq("id", existingVote.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        action: "updated",
        vote_type,
      });
    }

    // Create new vote
    const { error: insertError } = await supabase.from("review_votes").insert({
      review_id,
      voter_id: user.id,
      vote_type,
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      action: "created",
      vote_type,
    });
  } catch (error) {
    console.error("Error in PATCH /api/playtest-reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
