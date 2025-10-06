import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

// GET /api/stripe/connect/account - Get user's connected account status
export async function GET() {
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

    // Get connected account from database
    const { data: connectedAccount } = await supabase
      .from("stripe_connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!connectedAccount) {
      return NextResponse.json({ account: null, hasAccount: false });
    }

    // Fetch latest account status from Stripe
    const account = await stripe.accounts.retrieve(
      connectedAccount.stripe_account_id,
    );

    // Update database with latest info
    await supabase
      .from("stripe_connected_accounts")
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted || false,
        country: account.country || null,
        currency: account.default_currency || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      account: {
        id: connectedAccount.id,
        stripe_account_id: connectedAccount.stripe_account_id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        country: account.country,
        currency: account.default_currency,
      },
      hasAccount: true,
    });
  } catch (error) {
    console.error("Error fetching connected account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 },
    );
  }
}
