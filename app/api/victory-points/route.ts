import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/victory-points - Get user's VP balance and recent transactions
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
    const userId = searchParams.get("user_id") || user.id;
    const includeTransactions = searchParams.get("transactions") === "true";

    // Get VP balance
    const { data: vpBalance, error: balanceError } = await supabase
      .from("user_victory_points")
      .select("total_points, lifetime_earned, updated_at")
      .eq("user_id", userId)
      .single();

    if (balanceError && balanceError.code !== "PGRST116") {
      console.error("Error fetching VP balance:", balanceError);
      return NextResponse.json(
        { error: "Failed to fetch VP balance" },
        { status: 500 },
      );
    }

    const response: {
      balance: typeof vpBalance;
      transactions?: unknown[];
    } = {
      balance: vpBalance || {
        total_points: 0,
        lifetime_earned: 0,
        updated_at: new Date().toISOString(),
      },
    };

    // Optionally include recent transactions
    if (includeTransactions && userId === user.id) {
      const { data: transactions } = await supabase
        .from("victory_points_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      response.transactions = transactions || [];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/victory-points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/victory-points - Award VP manually (admin only or specific actions)
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
    const { target_user_id, points, reason, reference_type, reference_id } =
      body;

    if (!target_user_id || !points || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Call the award_victory_points function
    const { error } = await supabase.rpc("award_victory_points", {
      p_user_id: target_user_id,
      p_points: points,
      p_transaction_type: "manual_adjustment",
      p_reference_type: reference_type || null,
      p_reference_id: reference_id || null,
      p_description: reason,
    });

    if (error) {
      console.error("Error awarding VP:", error);
      return NextResponse.json(
        { error: "Failed to award VP" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Awarded ${points} VP`,
    });
  } catch (error) {
    console.error("Error in POST /api/victory-points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
