import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/earnings - Get user's earnings summary
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get available balance (ready to withdraw)
    const { data: availableData } = await supabase.rpc("get_available_balance", {
      p_user_id: user.id,
    });

    // Get pending earnings (not yet processed from orders)
    const { data: pendingData } = await supabase.rpc("get_pending_earnings", {
      p_user_id: user.id,
    });

    // Get total lifetime earnings
    const { data: lifetimeData } = await supabase
      .from("revenue_splits")
      .select("amount")
      .eq("recipient_id", user.id);

    const lifetimeEarnings = lifetimeData?.reduce(
      (sum, split) => sum + Number(split.amount),
      0,
    ) || 0;

    // Get recent revenue splits
    const { data: recentSplits } = await supabase
      .from("revenue_splits")
      .select(
        `
        id,
        amount,
        percentage,
        status,
        created_at,
        order_items (
          project_title,
          price,
          order_id
        )
      `,
      )
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get payout history
    const { data: payouts } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false })
      .limit(10);

    // Get payout schedule
    const { data: schedule } = await supabase
      .from("payout_schedules")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      available: Number(availableData) || 0,
      pending: Number(pendingData) || 0,
      lifetime: lifetimeEarnings,
      recentSplits: recentSplits || [],
      payouts: payouts || [],
      schedule: schedule || null,
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 },
    );
  }
}
