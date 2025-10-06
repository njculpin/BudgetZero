import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/orders/[order_id] - Get order details by order number or ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_id: string }> },
) {
  try {
    const { order_id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to find by ID or order number
    let query = supabase
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
            cover_image_url,
            description
          )
        )
      `,
      )
      .eq("buyer_id", user.id);

    // Check if order_id is UUID format (ID) or order number
    if (order_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq("id", order_id);
    } else {
      query = query.eq("order_number", order_id);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
