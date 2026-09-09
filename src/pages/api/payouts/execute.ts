import type { APIRoute } from 'astro';
import { getUserById } from '@/lib/data-access/users';
import {
  getPayoutById,
  claimPayoutForProcessing,
  settlePayout,
  releasePayout,
} from '@/lib/data-access/payouts';
import { createTransfer } from '@/lib/payments';
import { verifyAdmin, logAdminAction } from '@/lib/auth/admin';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  // Verify admin authorization
  const authResult = await verifyAdmin(cookies);

  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
      status: authResult.error === 'Not authenticated' || authResult.error === 'Invalid session' || authResult.error === 'Authentication failed' ? 401 : 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminUserId = authResult.userId!;

  try {
    // Get payout ID from request body
    const body = await request.json();
    const { payoutId } = body;

    if (!payoutId) {
      return new Response(JSON.stringify({ error: 'Missing payout ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get payout details
    const payout = await getPayoutById(payoutId);

    if (!payout) {
      return new Response(JSON.stringify({ error: 'Payout not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check payout status
    if (payout.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Payout is already ${payout.status}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get recipient user
    const recipient = await getUserById(payout.user_id);

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'Recipient not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify recipient has Connect account
    if (!recipient.stripe_connect_account_id) {
      // Release rather than just marking failed, so the reserved earnings return to
      // the creator's balance once they finish Connect onboarding.
      await releasePayout(payoutId, 'No Connect account configured');

      return new Response(
        JSON.stringify({ error: 'Recipient has no Connect account' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Claim the payout by moving it pending -> processing conditionally. The status
    // read above is not enough on its own: two concurrent executions could both see
    // 'pending' and both transfer. This update only succeeds for one of them.
    const claimed = await claimPayoutForProcessing(payoutId);

    if (!claimed) {
      return new Response(
        JSON.stringify({ error: 'Payout is already being processed' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Create Stripe transfer
      const transfer = await createTransfer(
        recipient.stripe_connect_account_id,
        payout.amount_cents,
        payout.currency,
        {
          payout_id: payoutId,
          user_id: payout.user_id,
        }
      );

      // Mark the payout paid AND transition every royalty transaction it reserved
      // to 'paid'. Updating only the payout row would leave those transactions
      // reserved forever, or — before reservation existed — back in the available
      // balance to be withdrawn a second time.
      const settledCount = await settlePayout(payoutId, transfer.id);

      // Log admin action
      await logAdminAction({
        userId: adminUserId,
        action: 'payout.execute',
        resourceType: 'payout',
        resourceId: payoutId,
        details: {
          transferId: transfer.id,
          amountCents: payout.amount_cents,
          currency: payout.currency,
          recipientUserId: payout.user_id,
          royaltyTransactionsSettled: settledCount,
        },
        ipAddress: clientAddress,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return new Response(
        JSON.stringify({
          success: true,
          payoutId,
          transferId: transfer.id,
          royaltyTransactionsSettled: settledCount,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (transferError) {
      // Transfer failed, update payout status
      const errorMessage =
        transferError instanceof Error
          ? transferError.message
          : 'Transfer failed';

      // Return the reserved royalty transactions to available balance and mark the
      // payout failed. Without this the creator's earnings stay locked in a payout
      // that will never complete.
      await releasePayout(payoutId, errorMessage);

      // Log failed admin action
      await logAdminAction({
        userId: adminUserId,
        action: 'payout.execute.failed',
        resourceType: 'payout',
        resourceId: payoutId,
        details: {
          error: errorMessage,
          amountCents: payout.amount_cents,
          currency: payout.currency,
          recipientUserId: payout.user_id,
        },
        ipAddress: clientAddress,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      console.error('Transfer error:', transferError);

      return new Response(
        JSON.stringify({
          error: 'Transfer failed',
          details: errorMessage,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Payout execution error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to execute payout',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
