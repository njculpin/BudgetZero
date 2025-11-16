import type { APIRoute } from 'astro';
import { setSession } from '@/lib/auth';
import { getUserById } from '@/lib/data-access/users';
import { getConnectAccountStatus } from '@/lib/payments';
import { serverClient } from '@/lib/data-access/client';

export const POST: APIRoute = async ({ cookies }) => {
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

    if (!user.stripe_connect_account_id) {
      return new Response(JSON.stringify({ error: 'No Connect account found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Connect account status from Stripe
    const status = await getConnectAccountStatus(user.stripe_connect_account_id);

    // Update user record with current status
    const { error: updateError } = await serverClient
      .from('users')
      .update({
        stripe_connect_onboarded: status.onboarded,
        stripe_connect_details_submitted: status.detailsSubmitted,
        stripe_connect_charges_enabled: status.chargesEnabled,
        stripe_connect_payouts_enabled: status.payoutsEnabled,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating Connect status:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify(status),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Connect status refresh error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to refresh status',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
