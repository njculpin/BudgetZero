import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

interface CartItem {
  projectId: string;
  projectTitle: string;
  pricingTierId: string;
  pricingTierName: string;
  price: number;
  coverImageUrl?: string;
}

// POST /api/checkout - Create Stripe checkout session
export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items }: { items: CartItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 },
      );
    }

    // Validate all items exist and are published
    const projectIds = items.map((item) => item.projectId);
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, status, cover_image_url")
      .in("id", projectIds)
      .eq("status", "published");

    if (projectsError || !projects || projects.length !== items.length) {
      return NextResponse.json(
        { error: "Some projects are not available for purchase" },
        { status: 400 },
      );
    }

    // Validate pricing tiers
    const tierIds = items.map((item) => item.pricingTierId);
    const { data: tiers, error: tiersError } = await supabase
      .from("pricing_tiers")
      .select("id, name, price_cents, is_active")
      .in("id", tierIds)
      .eq("is_active", true);

    if (tiersError || !tiers || tiers.length !== items.length) {
      return NextResponse.json(
        { error: "Some pricing tiers are not available" },
        { status: 400 },
      );
    }

    // Create order in database first
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      project_id: item.projectId,
      pricing_tier_id: item.pricingTierId,
      price: item.price,
      project_title: item.projectTitle,
      pricing_tier_name: item.pricingTierName,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    if (itemsError || !insertedItems) {
      console.error("Error creating order items:", itemsError);
      // Rollback order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 },
      );
    }

    // Calculate revenue splits for each item
    try {
      for (const item of insertedItems) {
        const { error: splitError } = await supabase.rpc(
          "calculate_revenue_splits",
          {
            p_order_item_id: item.id,
            p_project_id: item.project_id,
            p_price: item.price,
          },
        );

        if (splitError) {
          throw new Error(`Failed to calculate revenue splits: ${splitError.message}`);
        }
      }
    } catch (splitError) {
      console.error("Error calculating revenue splits:", splitError);
      // Rollback order and order items
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to process order. Please try again." },
        { status: 500 },
      );
    }

    // Create Stripe checkout session
    const line_items = items.map((item) => {
      const project = projects.find((p) => p.id === item.projectId);
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.projectTitle,
            description: item.pricingTierName,
            images: project?.cover_image_url ? [project.cover_image_url] : [],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items,
      mode: "payment",
      success_url: `${request.headers.get("origin")}/orders/${order.order_number}?success=true`,
      cancel_url: `${request.headers.get("origin")}/marketplace?canceled=true`,
      metadata: {
        order_id: order.id,
        buyer_id: user.id,
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        status: "processing",
      })
      .eq("id", order.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
