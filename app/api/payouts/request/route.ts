import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

// POST /api/payouts/request - Request a payout
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

    const { amount } = await request.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 },
      );
    }

    // Check if user has connected account
    const { data: connectedAccount } = await supabase
      .from("stripe_connected_accounts")
      .select("stripe_account_id, payouts_enabled")
      .eq("user_id", user.id)
      .single();

    if (!connectedAccount) {
      return NextResponse.json(
        { error: "No connected account found. Please complete payout setup." },
        { status: 400 },
      );
    }

    if (!connectedAccount.payouts_enabled) {
      return NextResponse.json(
        {
          error:
            "Payouts not enabled on your account. Please complete onboarding.",
        },
        { status: 400 },
      );
    }

    // Check available balance
    const { data: availableBalance } = await supabase.rpc(
      "get_available_balance",
      {
        p_user_id: user.id,
      },
    );

    const available = Number(availableBalance) || 0;

    if (amount > available) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: $${available.toFixed(2)}`,
        },
        { status: 400 },
      );
    }

    // Minimum payout amount
    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum payout amount is $10.00" },
        { status: 400 },
      );
    }

    // Create payout request in database
    const { data: payoutRequest, error: insertError } = await supabase
      .from("payout_requests")
      .insert({
        user_id: user.id,
        amount,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !payoutRequest) {
      console.error("Error creating payout request:", insertError);
      return NextResponse.json(
        { error: "Failed to create payout request" },
        { status: 500 },
      );
    }

    // Create Stripe transfer
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        destination: connectedAccount.stripe_account_id,
        metadata: {
          user_id: user.id,
          payout_request_id: payoutRequest.id,
        },
      });

      // Update payout request with transfer ID
      await supabase
        .from("payout_requests")
        .update({
          stripe_transfer_id: transfer.id,
          status: "processing",
          processed_at: new Date().toISOString(),
        })
        .eq("id", payoutRequest.id);

      // Mark revenue splits as paid and link to payout request
      await supabase
        .from("revenue_splits")
        .update({
          status: "paid",
          payout_request_id: payoutRequest.id,
        })
        .eq("recipient_id", user.id)
        .eq("status", "processing")
        .is("payout_request_id", null);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "payout_processing",
        title: "Payout Processing",
        message: `Your payout of $${amount.toFixed(2)} is being processed.`,
        metadata: {
          payout_request_id: payoutRequest.id,
          amount,
        },
      });

      return NextResponse.json({
        success: true,
        payoutRequest: {
          id: payoutRequest.id,
          amount,
          status: "processing",
        },
      });
    } catch (stripeError) {
      console.error("Stripe transfer error:", stripeError);

      // Update payout request as failed
      await supabase
        .from("payout_requests")
        .update({
          status: "failed",
          error_message:
            stripeError instanceof Error ? stripeError.message : "Unknown error",
        })
        .eq("id", payoutRequest.id);

      return NextResponse.json(
        { error: "Failed to process payout. Please try again later." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json(
      { error: "Failed to request payout" },
      { status: 500 },
    );
  }
}
