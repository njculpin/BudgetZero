import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as z from "zod";

const pricingSchema = z.object({
  pricing_type: z.enum(["free", "one_time", "subscription"]),
  price_cents: z.number().min(0),
  billing_interval: z.enum(["month", "year"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: assetId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("creator_id")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = pricingSchema.parse(body);

    // Validate: subscriptions must have billing interval
    if (validatedData.pricing_type === "subscription" && !validatedData.billing_interval) {
      return NextResponse.json(
        { error: "Billing interval required for subscriptions" },
        { status: 400 },
      );
    }

    // Validate: free assets must have price_cents = 0
    if (validatedData.pricing_type === "free" && validatedData.price_cents !== 0) {
      return NextResponse.json(
        { error: "Free assets must have price of 0" },
        { status: 400 },
      );
    }

    // Deactivate all existing pricing for this asset
    await supabase
      .from("asset_pricing")
      .update({ is_active: false })
      .eq("asset_id", assetId);

    // Insert new pricing
    const { data: newPricing, error: insertError } = await supabase
      .from("asset_pricing")
      .insert({
        asset_id: assetId,
        pricing_type: validatedData.pricing_type,
        price_cents: validatedData.price_cents,
        billing_interval: validatedData.billing_interval || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting pricing:", insertError);
      return NextResponse.json(
        { error: "Failed to create pricing" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: newPricing });
  } catch (error) {
    console.error("Error updating asset pricing:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
