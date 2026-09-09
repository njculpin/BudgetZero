import { serverClient } from './client';
import type { StripeWebhookEvent } from '@/types';

/**
 * Stripe delivers every webhook at least once, and retries on any non-2xx response.
 * Without a guard, a single retry of `checkout.session.completed` creates a second
 * sale and a second set of royalty obligations for one payment.
 *
 * `stripe_webhook_events.stripe_event_id` carries a UNIQUE constraint, so the insert
 * below is the claim: exactly one caller can win it, and the database — not
 * application logic — is what makes that true under concurrent delivery.
 */

/**
 * Attempt to claim a Stripe event for processing.
 *
 * Returns `true` if this caller won the claim and should process the event, and
 * `false` if the event was already claimed (a duplicate delivery to acknowledge and
 * ignore). Callers that claim an event but then fail must call
 * `releaseWebhookEvent` so Stripe's retry can pick it up again.
 */
export async function claimWebhookEvent(
  stripeEventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const { error } = await serverClient
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: stripeEventId,
      event_type: eventType,
      payload,
      processed: false,
    });

  if (!error) {
    return true;
  }

  // 23505 = unique_violation: another delivery of this same event already claimed it.
  if (error.code === '23505') {
    return false;
  }

  // Any other failure is a real error. Rethrow so the handler returns non-2xx and
  // Stripe retries, rather than silently dropping a paid order.
  throw new Error(
    `Failed to claim webhook event ${stripeEventId}: ${error.message}`
  );
}

/**
 * Mark a claimed event as fully processed.
 */
export async function markWebhookEventProcessed(
  stripeEventId: string
): Promise<void> {
  const { error } = await serverClient
    .from('stripe_webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', stripeEventId);

  if (error) {
    console.error(
      `Failed to mark webhook event ${stripeEventId} processed:`,
      error
    );
  }
}

/**
 * Release a claim so a later Stripe retry can process the event again.
 *
 * Called when processing throws partway through. Deleting the claim rather than
 * leaving it `processed: false` keeps the claim check a single unambiguous test.
 */
export async function releaseWebhookEvent(
  stripeEventId: string
): Promise<void> {
  const { error } = await serverClient
    .from('stripe_webhook_events')
    .delete()
    .eq('stripe_event_id', stripeEventId)
    .eq('processed', false);

  if (error) {
    console.error(
      `Failed to release webhook event ${stripeEventId}:`,
      error
    );
  }
}

/**
 * Look up a recorded webhook event. Useful for support and for reconciling a sale
 * against the payment that produced it.
 */
export async function getWebhookEvent(
  stripeEventId: string
): Promise<StripeWebhookEvent | null> {
  const { data, error } = await serverClient
    .from('stripe_webhook_events')
    .select('*')
    .eq('stripe_event_id', stripeEventId)
    .single();

  if (error) {
    return null;
  }

  return data as StripeWebhookEvent;
}
