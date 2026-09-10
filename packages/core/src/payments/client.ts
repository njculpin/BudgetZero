/**
 * Stripe SDK client.
 *
 * Following the SDK isolation pattern: Stripe is imported here and nowhere else.
 *
 * **Initialised lazily, on first use.** It used to construct the client — and
 * throw on a missing `STRIPE_SECRET_KEY` — at module load. That was survivable
 * while only Stripe-using routes imported it, but the API route table imports
 * every controller eagerly, so a missing key stopped being "checkout is broken"
 * and became "every endpoint returns 500, including ones that touch no payment
 * code at all". A missing key should fail when something tries to charge, not
 * when an unrelated module is imported.
 *
 * The export is still a plain `stripe` object so call sites are unchanged; the
 * proxy defers construction to the first property access.
 */

import Stripe from 'stripe';

import { USE_MOCK_STRIPE } from './mock-mode';

let client: Stripe | null = null;

function resolveClient(): Stripe {
  if (client) return client;

  if (USE_MOCK_STRIPE) {
    throw new Error(
      'The Stripe client was used while MOCK_STRIPE is enabled. Mock mode is ' +
        'meant to intercept these calls before they reach the SDK — see ' +
        'payments/mock-mode.ts.'
    );
  }

  const secretKey = import.meta.env?.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Set it, or set MOCK_STRIPE=true for local ' +
        'development without a Stripe account.'
    );
  }

  client = new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  });

  return client;
}

/**
 * The Stripe client.
 *
 * Reads like the SDK's own export; constructs on first property access.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    return Reflect.get(resolveClient(), property, receiver);
  },
  has(_target, property) {
    return Reflect.has(resolveClient(), property);
  },
}) as Stripe;
