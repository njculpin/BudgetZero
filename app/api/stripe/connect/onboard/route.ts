import { NextResponse } from "next/server";
import {
  useAdminCreateConnectedAccount,
  useAdminGetConnectedAccount,
  useAdminGetMe,
} from "@/lib/sdk/server";
import { stripe } from "@/lib/stripe/config";

// POST /api/stripe/connect/onboard - Create Stripe Connect account and onboarding link
export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 503 },
      );
    }

    const user = await useAdminGetMe();

    // Check if user already has a connected account
    const { data: existingAccount } = await useAdminGetConnectedAccount(
      user.id,
    );

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
      await useAdminCreateConnectedAccount({
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
