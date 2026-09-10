/**
 * Error monitoring and structured logging.
 *
 * This is the SDK isolation layer for observability: no monitoring SDK is imported
 * anywhere outside `/src/lib/monitoring/`. Swapping Sentry for another provider
 * should mean editing `client.ts` and nothing else.
 *
 * Prefer these over bare `console.error` in code paths where a silent failure costs
 * money or access — webhooks, payouts, downloads, checkout. Elsewhere `console.error`
 * is still fine; it reaches the platform logs either way.
 */

import { captureToProvider, type Severity } from './client';

export type { Severity } from './client';

/**
 * Structured context attached to a report. Keep it free of secrets and of anything
 * that identifies a person beyond an opaque id — this leaves the system.
 */
export interface ErrorContext {
  /** Where this happened, e.g. 'webhook.checkout_completed'. */
  operation: string;
  userId?: string;
  /** Ids useful for reconciliation: saleId, payoutId, productId, stripeEventId. */
  [key: string]: unknown;
}

/**
 * Report a failure that a human should see.
 *
 * Never throws: monitoring must not be able to break the request it is observing.
 */
export function captureError(error: unknown, context: ErrorContext): void {
  const normalized = error instanceof Error ? error : new Error(String(error));

  try {
    captureToProvider('error', normalized, context);
  } catch (monitoringError) {
    // Last resort — if the reporter itself fails, at least land it in platform logs.
    console.error('Monitoring failed to report an error:', monitoringError);
    console.error(`[${context.operation}]`, normalized);
  }
}

/**
 * Report something noteworthy that is not an error — a refund with no matching
 * sale, a duplicate webhook, a payout to a recipient without Connect enabled.
 */
export function captureMessage(
  message: string,
  context: ErrorContext,
  severity: Severity = 'warning'
): void {
  try {
    captureToProvider(severity, new Error(message), context);
  } catch (monitoringError) {
    console.error('Monitoring failed to report a message:', monitoringError);
    console.error(`[${context.operation}]`, message);
  }
}
