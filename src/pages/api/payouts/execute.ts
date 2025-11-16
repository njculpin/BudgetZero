import type { APIRoute } from 'astro';
import { setSession } from '@/lib/auth';
import { getUserById } from '@/lib/data-access/users';
import { getPayoutById, updatePayoutStatus } from '@/lib/data-access/payouts';
import { createTransfer } from '@/lib/payments';

// TODO: Add proper admin authorization check
// For now, this is a placeholder. In production, you should:
// 1. Create an admin role in your database
// 2. Check if the user has admin permissions
// 3. Consider using a separate admin panel/route

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // TODO: Check if user is admin
  // const isAdmin = await checkIfUserIsAdmin(session.data.user.id);
  // if (!isAdmin) {
  //   return new Response(JSON.stringify({ error: 'Unauthorized' }), {
  //     status: 403,
  //     headers: { 'Content-Type': 'application/json' },
  //   });
  // }

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
