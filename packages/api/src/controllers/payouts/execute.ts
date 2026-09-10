import type { Controller } from '../../context';
import { getUserById } from '@gameloopers/core/data-access/users';
import {
  getPayoutById,
  claimPayoutForProcessing,
  getPayoutItems,
  settlePayout,
  releasePayout,
} from '@gameloopers/core/data-access/payouts';
import { createTransfer } from '@gameloopers/core/payments';
import { verifyAdmin, logAdminAction } from '@gameloopers/core/auth/admin';
import { captureError } from '@gameloopers/core/monitoring';

export const payoutsExecute: Controller = async ({ request, clientAddress, userId }) => {
  // Verify admin authorization
  const authResult = await verifyAdmin(userId);

  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
      status:
        authResult.error === 'Not authenticated' ||
        authResult.error === 'Invalid session' ||
        authResult.error === 'Authentication failed'
          ? 401
          : 403,
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

    // Verify the recipient can actually receive a transfer.
    //
    // request-payout.ts checks this at request time, but a Connect account can be
    // restricted, deauthorized, or have its transfers capability revoked between
    // the request and the admin clicking Pay — and this route previously checked
    // only that an account id existed. The stored flag is kept current by the
    // account.updated webhook.
    if (
      !recipient.stripe_connect_account_id ||
      !recipient.stripe_connect_payouts_enabled
    ) {
      const reason = !recipient.stripe_connect_account_id
        ? 'No Connect account configured'
        : 'Stripe Connect payouts are not enabled for this account';

      // Release rather than just marking failed, so the reserved earnings return
      // to the creator's balance once their account is in good standing.
      await releasePayout(payoutId, reason);

      return new Response(JSON.stringify({ error: reason }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    // Defence in depth: never wire an amount that is not backed by reserved
    // royalty transactions. request_payout() is the only thing that should create
    // a payout and it always writes matching items — but this route is the last
    // gate before real money moves, and a mismatch means something upstream is
    // wrong in a way we should not paper over.
    const items = await getPayoutItems(payoutId);
    const backedCents = items
      .filter((item) => !item.voided)
      .reduce((sum, item) => sum + item.amount_cents, 0);

    if (backedCents !== payout.amount_cents) {
      await releasePayout(
        payoutId,
        `Integrity check failed: amount ${payout.amount_cents} is backed by ${backedCents} in reserved royalties`
      );

      captureError(new Error('Payout amount does not match its reserved items'), {
        operation: 'payout.integrity_check',
        payoutId,
        recipientUserId: payout.user_id,
        amountCents: payout.amount_cents,
        backedCents,
      });

      return new Response(JSON.stringify({ error: 'Payout integrity check failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // The Stripe transfer is the point of no return. Everything before it may be
    // undone by releasing the reservation; nothing after it may be, because the
    // money has already moved. Keeping settlement inside the transfer's catch
    // meant a settlement failure would release the reservation and let the same
    // earnings be withdrawn a second time.
    let transfer: Awaited<ReturnType<typeof createTransfer>>;

    try {
      transfer = await createTransfer(
        recipient.stripe_connect_account_id,
        payout.amount_cents,
        payout.currency,
        {
          payout_id: payoutId,
          user_id: payout.user_id,
        },
        // Survives a lost response: a retry returns the original transfer rather
        // than creating a second one.
        `payout_${payoutId}`
      );
    } catch (transferError) {
      const errorMessage =
        transferError instanceof Error ? transferError.message : 'Transfer failed';

      // No money moved. Return the reserved royalties to the creator's balance.
      // Wrapped so a release failure cannot mask the transfer failure that
      // actually matters here.
      try {
        await releasePayout(payoutId, errorMessage);
      } catch (releaseError) {
        captureError(releaseError, {
          operation: 'payout.release_after_failed_transfer',
          payoutId,
          recipientUserId: payout.user_id,
        });
      }

      captureError(transferError, {
        operation: 'payout.transfer',
        payoutId,
        recipientUserId: payout.user_id,
        amountCents: payout.amount_cents,
      });

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
        ipAddress: clientAddress ?? undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

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

    // ---- Past this line the money has moved. Never release. ----

    let settledCount = 0;

    try {
      settledCount = await settlePayout(payoutId, transfer.id);
    } catch (settlementError) {
      // The creator has been paid but our records do not show it. Releasing here
      // would hand them the same earnings twice, so the reservation stays put and
      // this is escalated for manual reconciliation instead.
      captureError(settlementError, {
        operation: 'payout.settle_after_successful_transfer',
        payoutId,
        transferId: transfer.id,
        recipientUserId: payout.user_id,
        amountCents: payout.amount_cents,
        severity: 'needs manual reconciliation',
      });

      return new Response(
        JSON.stringify({
          error: 'Transfer succeeded but settlement failed',
          details:
            'The recipient has been paid. Do not retry — reconcile this payout manually.',
          payoutId,
          transferId: transfer.id,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Audit logging must not be able to undo a completed payout.
    try {
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
        ipAddress: clientAddress ?? undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (logError) {
      captureError(logError, { operation: 'payout.audit_log', payoutId });
    }

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
  } catch (error) {
    captureError(error, { operation: 'payout.execute', userId: adminUserId });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to execute payout',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
