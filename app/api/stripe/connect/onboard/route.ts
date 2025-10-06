import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

// POST /api/stripe/connect/onboard - Create Stripe Connect account and onboarding link
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

    // Check if user already has a connected account
    const { data: existingAccount } = await supabase
      .from("stripe_connected_accounts")
      .select("stripe_account_id, details_submitted")
      .eq("user_id", user.id)
      .single();

    let accountId = existingAccount?.stripe_account_id;

    // Create new Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          user_id: user.id,
        },
      });

      accountId = account.id;

      // Save to database
      await supabase.from("stripe_connected_accounts").insert({
        user_id: user.id,
        stripe_account_id: accountId,
        account_type: "express",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${request.headers.get("origin")}/settings/payouts?refresh=true`,
      return_url: `${request.headers.get("origin")}/settings/payouts?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });
  } catch (error) {
    console.error("Stripe Connect onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 },
    );
  }
}
