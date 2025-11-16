import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getUserPayouts, getAvailablePayoutBalance } from "@/lib/data-access/payouts";

export const GET: APIRoute = async ({ cookies }) => {
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
    // Get available balance and payout history in parallel
    const [balance, payouts] = await Promise.all([
      getAvailablePayoutBalance(userId),
      getUserPayouts(userId),
    ]);

    return new Response(
      JSON.stringify({
        availableBalance: balance.totalCents,
        transactionCount: balance.transactionIds.length,
        payouts,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get balance error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to get balance",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
