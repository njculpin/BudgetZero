import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getUserById } from '@gameloopers/core/data-access/users';
import {
  createConnectAccount,
  createAccountLink,
} from '@gameloopers/core/payments/connect';
import { serverClient } from '@gameloopers/core/data-access/client';

export const connectCreateAccountLink: Controller = async ({ url, userId }) => {
  if (!userId) return unauthorized('Not authenticated');

  try {
    // Get user data
    const user = await getUserById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origin = url.origin;
    const refreshUrl = `${origin}/settings`;
    const returnUrl = `${origin}/settings`;

    let stripeAccountId = user.stripe_connect_account_id;

    // Create Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email: user.email,
        country: 'US', // TODO: Make this configurable
      });

      stripeAccountId = account.id;

      // Save account ID to user record
      await serverClient
        .from('users')
        .update({
          stripe_connect_account_id: stripeAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // Create account link for onboarding
    const accountLink = await createAccountLink(stripeAccountId, refreshUrl, returnUrl);

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId: stripeAccountId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Create account link error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create account link',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
