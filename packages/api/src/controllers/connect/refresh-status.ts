import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import { getUserById } from '@gameloopers/core/data-access/users';
import { getConnectAccountStatus } from '@gameloopers/core/payments';
import { serverClient } from '@gameloopers/core/data-access/client';

export const connectRefreshStatus: Controller = async ({ request, userId }) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');

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
