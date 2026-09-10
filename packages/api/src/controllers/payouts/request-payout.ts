import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { z } from 'zod';
import { getUserById } from '@gameloopers/core/data-access/users';
import {
  requestPayout,
  getAvailablePayoutBalance,
  getPayoutById,
} from '@gameloopers/core/data-access/payouts';

const requestPayoutSchema = z.object({
  amountCents: z.number().int().positive(),
  notes: z.string().optional(),
});

// Minimum payout threshold ($10.00)
const MINIMUM_PAYOUT_CENTS = 1000;

export const payoutsRequestPayout: Controller = async ({ request, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    const body = await request.json();
    const validatedData = requestPayoutSchema.parse(body);

    // Check if user has Stripe Connect setup
    const user = await getUserById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.stripe_connect_account_id || !user.stripe_connect_payouts_enabled) {
      return new Response(
        JSON.stringify({
          error: 'Stripe Connect not setup. Please complete payout setup first.',
          setupRequired: true,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check minimum payout amount up front so an obviously-too-small request gets a
    // clear message rather than a balance error.
    if (validatedData.amountCents < MINIMUM_PAYOUT_CENTS) {
      return new Response(
        JSON.stringify({
          error: `Minimum payout amount is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}`,
          minimumAmount: MINIMUM_PAYOUT_CENTS,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Reserve the funding transactions and create the payout in one atomic step.
    // The balance is deliberately not read first: checking here and reserving later
    // leaves a window where two concurrent requests both pass the check.
    let result;
    try {
      result = await requestPayout({
        userId,
        amountCents: validatedData.amountCents,
        minimumCents: MINIMUM_PAYOUT_CENTS,
        notes: validatedData.notes,
      });
    } catch (payoutError) {
      const message =
        payoutError instanceof Error ? payoutError.message : 'Payout request failed';

      // The function raises when the claimable total falls below the minimum, which
      // is a client-correctable condition rather than a server fault.
      if (message.includes('Insufficient available balance')) {
        const balance = await getAvailablePayoutBalance(userId);
        return new Response(
          JSON.stringify({
            error: `Insufficient balance. Available: $${(balance.totalCents / 100).toFixed(2)}`,
            availableBalance: balance.totalCents,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      throw payoutError;
    }

    const payout = await getPayoutById(result.payoutId);

    return new Response(
      JSON.stringify({
        success: true,
        payout,
        // Whole royalty transactions fund a payout, so the reserved amount can be
        // less than requested. Report what was actually reserved.
        reservedCents: result.reservedCents,
        transactionCount: result.transactionCount,
        requestedCents: validatedData.amountCents,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Request payout error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to request payout',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
