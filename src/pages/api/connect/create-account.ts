import type { APIRoute } from 'astro';
import { setSession } from '@/lib/auth';
import { getUserById } from '@/lib/data-access/users';
import { createConnectAccount, createAccountLink } from '@/lib/payments';
import { serverClient } from '@/lib/data-access/client';

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
  const userEmail = session.data.user.email || '';

  try {
    // Get user to check if they already have a Connect account
    const user = await getUserById(userId);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If user already has a Connect account, just create a new account link
    if (user.stripe_connect_account_id) {
      const origin = new URL(request.url).origin;

      const accountLink = await createAccountLink(
        user.stripe_connect_account_id,
        `${origin}/connect/onboarding`,
        `${origin}/connect/onboarding/complete`
      );

      return new Response(
        JSON.stringify({ url: accountLink.url }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create new Connect account
    const account = await createConnectAccount({
      email: userEmail,
      country: 'US', // TODO: Get from user preferences or IP
    });

    // Save Connect account ID to user
    const { error: updateError } = await serverClient
      .from('users')
      .update({
        stripe_connect_account_id: account.id,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error saving Connect account ID:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save Connect account' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create account link for onboarding
    const origin = new URL(request.url).origin;

    const accountLink = await createAccountLink(
      account.id,
      `${origin}/connect/onboarding`,
      `${origin}/connect/onboarding/complete`
    );

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Connect account creation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create Connect account',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
