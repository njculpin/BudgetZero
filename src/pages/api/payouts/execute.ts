import type { APIRoute } from 'astro';
import { getUserById } from '@/lib/data-access/users';
import { getPayoutById, updatePayoutStatus } from '@/lib/data-access/payouts';
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
      await updatePayoutStatus(
        payoutId,
        'failed',
        undefined,
        'No Connect account configured'
      );

      return new Response(
        JSON.stringify({ error: 'Recipient has no Connect account' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update status to processing
    await updatePayoutStatus(payoutId, 'processing');

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

      // Update payout with transfer ID and mark as paid
      await updatePayoutStatus(payoutId, 'paid', transfer.id);

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
        },
        ipAddress: clientAddress,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return new Response(
        JSON.stringify({
          success: true,
          payoutId,
          transferId: transfer.id,
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

      await updatePayoutStatus(payoutId, 'failed', undefined, errorMessage);

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
