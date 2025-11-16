/**
 * Payments Layer Public API
 *
 * This is the ONLY file that should be imported by other parts of the application.
 * Never import from client.ts or checkout.ts directly - always use this index.
 *
 * Example:
 *   import { createCheckoutSession } from '@/lib/payments';
 */

export {
  createCheckoutSession,
  verifyWebhookSignature,
  extractSessionData,
  getCheckoutSession,
} from './checkout';

export {
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
  getConnectAccountStatus,
  createTransfer,
  createLoginLink,
} from './connect';

export type {
  CreateConnectAccountParams,
  ConnectAccountStatus,
} from './connect';

// Re-export types for convenience
export type { default as Stripe } from 'stripe';
