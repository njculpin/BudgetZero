import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getUserById } from '@gameloopers/core/data-access/users';
import {
  getConnectAccountStatus,
  createLoginLink,
} from '@gameloopers/core/payments/connect';
import { serverClient } from '@gameloopers/core/data-access/client';

export const connectGetAccountStatus: Controller = async ({ userId }) => {
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

    // Check if user has a Connect account
    if (!user.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({
          hasAccount: false,
          status: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get account status from Stripe
    const status = await getConnectAccountStatus(user.stripe_connect_account_id);

    // Update user record with latest status
    await serverClient
      .from('users')
      .update({
        stripe_connect_onboarded: status.onboarded,
        stripe_connect_details_submitted: status.detailsSubmitted,
        stripe_connect_charges_enabled: status.chargesEnabled,
        stripe_connect_payouts_enabled: status.payoutsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Create login link if account is onboarded
    let dashboardUrl = null;
    if (status.onboarded) {
      try {
        const loginLink = await createLoginLink(user.stripe_connect_account_id);
        dashboardUrl = loginLink.url;
      } catch (error) {
        console.error('Error creating login link:', error);
      }
    }

    return new Response(
      JSON.stringify({
        hasAccount: true,
        status,
        dashboardUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get account status error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get account status',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
