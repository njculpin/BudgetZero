import type { APIRoute } from 'astro';
import { setSession } from '@/lib/auth';
import { getUserById } from '@/lib/data-access/users';
import { createPayout, getAvailablePayoutBalance } from '@/lib/data-access/payouts';

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

  const userId = session.data.user.id;

  try {
    // Get user
    const user = await getUserById(userId);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has Connect account set up
    if (!user.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ error: 'Please connect your bank account first' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if Connect account is onboarded
    if (!user.stripe_connect_onboarded || !user.stripe_connect_payouts_enabled) {
      return new Response(
        JSON.stringify({ error: 'Your bank account setup is not complete' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get form data
    const formData = await request.formData();
    const amountCentsStr = formData.get('amount_cents') as string;
    const transactionIdsStr = formData.get('transaction_ids') as string;

    if (!amountCentsStr || !transactionIdsStr) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const amountCents = parseInt(amountCentsStr, 10);
    const transactionIds = JSON.parse(transactionIdsStr) as string[];

    // Validate amount
    if (amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify available balance
    const availableBalance = await getAvailablePayoutBalance(userId);

    if (amountCents > availableBalance.totalCents) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create payout request
    const payout = await createPayout({
      userId,
      amountCents,
      currency: 'usd',
      royaltyTransactionIds: transactionIds,
      notes: 'User-requested payout',
    });

    if (!payout) {
      return new Response(
        JSON.stringify({ error: 'Failed to create payout request' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Redirect back to payouts
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/payouts',
      },
    });
  } catch (error) {
    console.error('Payout request error:', error);
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
