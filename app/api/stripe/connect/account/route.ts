import { NextResponse } from "next/server";
import {
  useAdminGetConnectedAccount,
  useAdminGetMe,
  useAdminUpdateConnectedAccount,
} from "@/lib/sdk/server";
import { stripe } from "@/lib/stripe/config";

// GET /api/stripe/connect/account - Get user's connected account status
export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 503 },
      );
    }

    const user = await useAdminGetMe();

    // Get connected account from database
    const { data: connectedAccount } = await useAdminGetConnectedAccount(
      user.id,
    );

    if (!connectedAccount) {
      return NextResponse.json({ account: null, hasAccount: false });
    }

    // Fetch latest account status from Stripe
    const account = await stripe.accounts.retrieve(
      connectedAccount.stripe_account_id,
    );

    // Update database with latest info
    await useAdminUpdateConnectedAccount(user.id, {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted || false,
      country: account.country || null,
      currency: account.default_currency || null,
      updated_at: new Date().toISOString(),
    });

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
