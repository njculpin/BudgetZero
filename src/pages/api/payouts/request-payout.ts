import type { APIRoute } from "astro";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import { getUserById } from "@/lib/data-access/users";
import { createPayout, getAvailablePayoutBalance } from "@/lib/data-access/payouts";

const requestPayoutSchema = z.object({
  amountCents: z.number().int().positive(),
  notes: z.string().optional(),
});

// Minimum payout threshold ($10.00)
const MINIMUM_PAYOUT_CENTS = 1000;

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;

  try {
    const body = await request.json();
    const validatedData = requestPayoutSchema.parse(body);

    // Check if user has Stripe Connect setup
    const user = await getUserById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!user.stripe_connect_account_id || !user.stripe_connect_payouts_enabled) {
      return new Response(
        JSON.stringify({
          error: "Stripe Connect not setup. Please complete payout setup first.",
          setupRequired: true,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get available balance
    const balance = await getAvailablePayoutBalance(userId);

    // Verify requested amount doesn't exceed available balance
    if (validatedData.amountCents > balance.totalCents) {
      return new Response(
        JSON.stringify({
          error: `Insufficient balance. Available: $${(balance.totalCents / 100).toFixed(2)}`,
          availableBalance: balance.totalCents,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check minimum payout amount
    if (validatedData.amountCents < MINIMUM_PAYOUT_CENTS) {
      return new Response(
        JSON.stringify({
          error: `Minimum payout amount is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}`,
          minimumAmount: MINIMUM_PAYOUT_CENTS,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create payout request
    const payout = await createPayout({
      userId,
      amountCents: validatedData.amountCents,
      currency: 'usd',
      royaltyTransactionIds: balance.transactionIds.slice(0, Math.ceil(validatedData.amountCents / (balance.totalCents / balance.transactionIds.length))),
      notes: validatedData.notes,
    });

    if (!payout) {
      return new Response(
        JSON.stringify({ error: "Failed to create payout request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payout,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("Request payout error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to request payout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
