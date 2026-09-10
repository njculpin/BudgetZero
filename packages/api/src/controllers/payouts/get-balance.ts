import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getUserPayouts, getAvailablePayoutBalance } from "@gameloopers/core/data-access/payouts";

export const payoutsGetBalance: Controller = async ({ userId }) => {
  if (!userId) return unauthorized('Not authenticated');

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
