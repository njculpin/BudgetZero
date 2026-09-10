import type { Payout } from '@gameloopers/core/types';

/**
 * The endpoints the payouts islands call, and the one signal that passes
 * between them.
 *
 * The balance card and the history card both read `get-balance`, so a
 * successful request has to refresh both. They deliberately do *not* share a
 * module-level resource: a `createResource` at module scope is created under
 * whichever render reaches it first, and on the server that object outlives the
 * request and is shared by every visitor. An event costs one extra GET per page
 * load and keeps each island's state inside the island, which is the rule in
 * CLAUDE.md.
 */

/** Stripe will not send a transfer below this, so neither will we. */
export const MINIMUM_PAYOUT_CENTS = 1000;

/** Dispatched on `window` after a payout is requested. */
export const PAYOUTS_CHANGED = 'payouts:changed';

export interface PayoutBalance {
  availableBalance: number;
  transactionCount: number;
  payouts: Payout[];
}

/**
 * Islands are `client:load`, so their modules also run while Astro renders them
 * on the server. Used as a resource source this keeps Solid from calling the
 * fetcher there, where `/api/...` has no origin to resolve against.
 */
export const isBrowser = () => (typeof window === 'undefined' ? undefined : true);

export async function fetchBalance(): Promise<PayoutBalance> {
  const response = await fetch('/api/payouts/get-balance');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load balance');
  }

  return data as PayoutBalance;
}

export async function requestPayout(amountCents: number, notes?: string): Promise<void> {
  const response = await fetch('/api/payouts/request-payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountCents, notes: notes || undefined }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to request payout');
  }
}

export function announcePayoutChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PAYOUTS_CHANGED));
}
