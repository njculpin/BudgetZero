import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/orders - Get user's order history
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        total_amount,
        status,
        created_at,
        completed_at,
        order_items (
          id,
          project_id,
          project_title,
          pricing_tier_name,
          price,
          projects (
            slug,
            cover_image_url
          )
        )
      `,
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 },
      );
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error("Error in orders route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
