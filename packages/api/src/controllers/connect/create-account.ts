import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getUserById } from '@gameloopers/core/data-access/users';
import { createConnectAccount, createAccountLink } from '@gameloopers/core/payments';
import { serverClient } from '@gameloopers/core/data-access/client';

export const connectCreateAccount: Controller = async ({
  request,
  userId,
  userEmail,
}) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');
  const email = userEmail ?? '';

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
        `${origin}/settings`,
        `${origin}/settings`
      );

      return new Response(JSON.stringify({ url: accountLink.url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new Connect account
    const account = await createConnectAccount({
      email: email,
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
      `${origin}/settings`,
      `${origin}/settings`
    );

    return new Response(JSON.stringify({ url: accountLink.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Connect account creation error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to create Connect account',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
