/**
 * Whether the Stripe integration runs against a mock instead of the real API.
 *
 * This is opt-in via an explicit `MOCK_STRIPE=true` and nothing else. It previously
 * also switched on whenever the build mode was `development`, which meant any
 * environment that happened to run in dev mode — a preview deploy, a misconfigured
 * NODE_ENV — silently disabled webhook signature verification. That turns the webhook
 * endpoint into an unauthenticated way to mint sales and royalty obligations, so the
 * mode is now something you must ask for by name.
 */
const MOCK_STRIPE_REQUESTED =
  (import.meta.env.MOCK_STRIPE ?? process.env.MOCK_STRIPE) === 'true';

/**
 * `import.meta.env.PROD` is set by Vite for any production build. Mock payments in a
 * production build are never legitimate, so fail at module load rather than booting an
 * app that accepts unsigned webhooks.
 */
if (MOCK_STRIPE_REQUESTED && import.meta.env.PROD) {
  throw new Error(
    'MOCK_STRIPE=true is set in a production build. Mock mode bypasses Stripe ' +
      'webhook signature verification and must never run in production. Unset ' +
      'MOCK_STRIPE to continue.'
  );
}

export const USE_MOCK_STRIPE = MOCK_STRIPE_REQUESTED;
