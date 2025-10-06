import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/payouts/schedule - Get user's payout schedule
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: schedule } = await supabase
      .from("payout_schedules")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 },
    );
  }
}

// POST /api/payouts/schedule - Create or update payout schedule
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      enabled,
      frequency,
      minimum_amount,
      day_of_month,
    }: {
      enabled: boolean;
      frequency: "weekly" | "biweekly" | "monthly";
      minimum_amount: number;
      day_of_month?: number;
    } = await request.json();

    // Validate inputs
    if (minimum_amount < 10) {
      return NextResponse.json(
        { error: "Minimum amount must be at least $10.00" },
        { status: 400 },
      );
    }

    if (frequency === "monthly" && day_of_month) {
      if (day_of_month < 1 || day_of_month > 28) {
        return NextResponse.json(
          { error: "Day of month must be between 1 and 28" },
          { status: 400 },
        );
      }
    }

    // Check if user has connected account with payouts enabled
    const { data: connectedAccount } = await supabase
      .from("stripe_connected_accounts")
      .select("payouts_enabled")
      .eq("user_id", user.id)
      .single();

    if (!connectedAccount?.payouts_enabled && enabled) {
      return NextResponse.json(
        {
          error:
            "Please complete payout setup before enabling automatic payouts",
        },
        { status: 400 },
      );
    }

    // Upsert schedule
    const { data: schedule, error } = await supabase
      .from("payout_schedules")
      .upsert(
        {
          user_id: user.id,
          enabled,
          frequency,
          minimum_amount,
          day_of_month: frequency === "monthly" ? day_of_month : null,
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error upserting schedule:", error);
      return NextResponse.json(
        { error: "Failed to update schedule" },
        { status: 500 },
      );
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 },
    );
  }
}

// DELETE /api/payouts/schedule - Disable automatic payouts
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await supabase
      .from("payout_schedules")
      .update({ enabled: false })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disabling schedule:", error);
    return NextResponse.json(
      { error: "Failed to disable schedule" },
      { status: 500 },
    );
  }
}
